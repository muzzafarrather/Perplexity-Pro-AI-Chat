import * as vscode from 'vscode';
import fetch from 'node-fetch';

// Async function to load webview HTML from extension package
async function getWebviewContent(context: vscode.ExtensionContext): Promise<string> {
	try {
		const htmlUri = vscode.Uri.joinPath(context.extensionUri, 'src', 'webview.html');
		const htmlData = await vscode.workspace.fs.readFile(htmlUri);
		return Buffer.from(htmlData).toString('utf8');
	} catch (err) {
		return `<html><body><h2>Could not load chat UI.</h2><pre>${err}</pre></body></html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "perplexity-pro-ai-chat" is now active!');

	// Hello World command
	const disposable = vscode.commands.registerCommand('perplexity-pro-ai-chat.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Perplexity Pro AI Chat!');
	});
	context.subscriptions.push(disposable);

	// Command to set API key securely
	const setApiKeyCmd = vscode.commands.registerCommand('perplexity-pro-ai-chat.setApiKey', async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your Perplexity Pro AI API key',
			password: true
		});
		if (apiKey) {
			await context.secrets.store('perplexityApiKey', apiKey);
		}
	});

class PerplexityChatViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _chatHistory: Array<{ role: string, content: string }> = [];
	private _context: vscode.ExtensionContext;
	private _secrets: vscode.SecretStorage;

	constructor(context: vscode.ExtensionContext, secrets: vscode.SecretStorage) {
		this._context = context;
		this._secrets = secrets;
		// Load chat history securely
		this._secrets.get('perplexityChatHistory').then(history => {
			if (history) {
				try { this._chatHistory = JSON.parse(history); } catch {}
			}
		});
	}

	async resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true
		};

		const html = await getWebviewContent(this._context);
		webviewView.webview.html = html;

		// Send chat history after HTML is set
		const sendHistory = () => {
			this._secrets.get('perplexityChatHistory').then(history => {
				let chatHistory = [];
				if (history) {
					try { chatHistory = JSON.parse(history); } catch {}
				}
				this._chatHistory = chatHistory;
				webviewView.webview.postMessage({ command: 'loadHistory', history: this._chatHistory });
			});
		};
		setTimeout(sendHistory, 100);

		webviewView.webview.onDidReceiveMessage(async message => {
			if (message.command === 'ask') {
				// Store user message in chat history
				this._chatHistory.push({ role: 'user', content: message.text });
				await this._secrets.store('perplexityChatHistory', JSON.stringify(this._chatHistory));

				const response = await askPerplexity(message.text, this._secrets, message.model);
				
				// Store AI response in chat history
				this._chatHistory.push({ role: 'ai', content: response });
				await this._secrets.store('perplexityChatHistory', JSON.stringify(this._chatHistory));

				// Parse response for agentic actions and code blocks
				const agenticActionPerformed = await this.handleAgenticActions(message.text, response, message.mode === 'agentic');
				
				if (!agenticActionPerformed) {
					// Only show response if no agentic action was performed
					webviewView.webview.postMessage({ command: 'response', text: response });
				}
			}
		});
	}

	private async handleAgenticActions(userPrompt: string, aiResponse: string, isAgentic: boolean): Promise<boolean> {
		if (!this._view) {
			return false;
		}

		try {
			// First, check if user prompt directly requests file creation
			const fileCreatePatterns = [
				/(?:create|write|make)(?: a)? (?:new )?(?:file|program)(?: named| called)? ['"]?([^'"}\s]+)['"]?/i,
				/(?:save|write)(?: the)?(?: following)? (?:code|program) (?:to|in)(?: a)? file(?: named| called)? ['"]?([^'"}\s]+)['"]?/i,
				/(?:implement|create) (?:a )?['"]?([^'"}\s]+\.py)['"]?/i
			];

			let fileName = null;
			let codeBlock = null;

			// Check for file creation request in user prompt
			for (const pattern of fileCreatePatterns) {
				const match = userPrompt.match(pattern);
				if (match) {
					fileName = match[1];
					break;
				}
			}

			// If we found a file name request, look for code block in AI response
			if (fileName) {
				const codeBlockMatch = aiResponse.match(/```(?:\w+)?\n([\s\S]*?)```/);
				if (codeBlockMatch) {
					codeBlock = codeBlockMatch[1].trim();
					// Perform file creation
					await this.performFileCreation(fileName, codeBlock);
					this._view.webview.postMessage({ 
						command: 'agenticInfo', 
						text: `Created file: ${fileName}` 
					});
					return true;
				}
			}

			// If in agentic mode, also check AI response for file creation patterns
			if (isAgentic) {
				const filePatterns = [
					/(?:create|add|make)(?: a)? file(?: named)? ([^\s]+)[^\n]*?with(?: the)? following content:?\n?```(?:\w+)?\n([\s\S]*?)```/gi,
					/(?:Here's the|I've created|Creating) (?:a )?(?:new )?file `?([^`\s]+)`?:?\n?```(?:\w+)?\n([\s\S]*?)```/gi
				];

				for (const pattern of filePatterns) {
					let match;
					while ((match = pattern.exec(aiResponse)) !== null) {
						const file = match[1];
						const code = match[2].trim();
						await this.performFileCreation(file, code);
						this._view.webview.postMessage({ 
							command: 'agenticInfo', 
							text: `Created file: ${file}` 
						});
						return true;
					}
				}
			}

			return false;
		} catch (error) {
			console.error('Error in handleAgenticActions:', error);
			if (this._view) {
				this._view.webview.postMessage({ 
					command: 'agenticInfo', 
					text: `Error performing action: ${error}` 
				});
			}
			return false;
		}
	}

	private async performFileCreation(fileName: string, content: string): Promise<void> {
		try {
			// If filename doesn't have a path, create it in the workspace root
			if (!fileName.includes('/') && !fileName.includes('\\')) {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders && workspaceFolders.length > 0) {
					fileName = vscode.Uri.joinPath(workspaceFolders[0].uri, fileName).fsPath;
				}
			}

			// Create or update the file
			const uri = vscode.Uri.file(fileName);
			const edit = new vscode.WorkspaceEdit();
			
			try {
				await vscode.workspace.fs.stat(uri);
				// File exists, get confirmation before overwriting
				const overwrite = await vscode.window.showWarningMessage(
					`File ${fileName} already exists. Do you want to overwrite it?`,
					'Yes',
					'No'
				);
				if (overwrite !== 'Yes') {
					return;
				}
			} catch {
				// File doesn't exist, create it
				edit.createFile(uri, { ignoreIfExists: true });
			}

			edit.insert(uri, new vscode.Position(0, 0), content);
			await vscode.workspace.applyEdit(edit);

			// Open the file in the editor
			const doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc);
		} catch (error) {
			console.error('Error in performFileCreation:', error);
			throw new Error(`Failed to create file ${fileName}: ${error}`);
		}
	}
}

// Register the chat sidebar view
const provider = new PerplexityChatViewProvider(context, context.secrets);
context.subscriptions.push(
	vscode.window.registerWebviewViewProvider('perplexityProAIChatView', provider)
);

// Register setApiKey command
context.subscriptions.push(setApiKeyCmd);
}

const PPLX_API_URL = 'https://api.perplexity.ai/chat/completions';

async function askPerplexity(text: string, secrets: vscode.SecretStorage, model: string = 'sonar-pro'): Promise<string> {
	const apiKey = await secrets.get('perplexityApiKey');
	if (!apiKey) {
		return 'Error: No Perplexity Pro AI API key set. Please use the "Set Perplexity Pro AI API Key" command to set your API key.';
	}

	try {
		const res = await fetch(PPLX_API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'user', content: text }
				],
				stream: false
			})
		});

		if (!res.ok) {
			const errorText = await res.text();
			return `Error: ${res.status} ${res.statusText}\n${errorText}`;
		}

		const data = await res.json() as { choices?: { message?: { content?: string } }[] };
		return data.choices?.[0]?.message?.content || 'No response from Perplexity Pro AI.';
	} catch (err: any) {
		return `Error: ${err.message}`;
	}
}

export function deactivate() {}
