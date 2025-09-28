# Perplexity Pro AI Chat for VS Code

A powerful VS Code extension that integrates Perplexity Pro AI directly into your development environment. Chat with AI, generate code, create files, and perform various development tasks using natural language - all within VS Code's native interface.

## 🌟 Features

- **🤖 Advanced AI Chat**: Direct integration with Perplexity Pro AI models (sonar-pro and sonar-research)
- **📝 Agentic File Operations**: Create, edit, and manage files using natural language
- **🔄 Model Selection**: Choose between optimized models for different tasks:
  - `sonar-pro`: Best for general coding tasks
  - `sonar-research`: Enhanced capabilities for complex queries
- **🔀 Dual Modes**: 
  - **Chat Mode**: For general discussions and code explanations
  - **Agent Mode**: For automatic file operations and code generation
- **🔐 Secure Storage**: VS Code SecretStorage integration for API key security
- **💾 Chat History**: Persistent conversations between sessions
- **🎨 Native UI**: Beautifully formatted interface with VS Code theme integration
- **⚡ Shell Commands**: Execute terminal commands directly from chat with `/command`

## 🚀 Getting Started

### Prerequisites
1. A Perplexity Pro account and API key
2. Visual Studio Code version 1.70.0 or higher

### Installation
1. Open VS Code
2. Access Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Perplexity Pro AI Chat"
4. Click Install

### API Key Setup
1. Get your API key from [Perplexity AI Dashboard](https://www.perplexity.ai/settings/api)
2. In VS Code:
   - Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Type "Perplexity Pro AI Chat: Set API Key"
   - Press Enter
   - Paste your API key
   The key is stored securely using VS Code's SecretStorage.

### Quick Start
1. Open the Perplexity Pro AI Chat sidebar
2. Select your preferred model (sonar-pro or sonar-research)
3. Choose your mode:
   - **Chat Mode**: For general AI assistance
   - **Agent Mode**: For automatic code/file operations
4. Type your request and press Enter

### Example Commands
- **File Creation**: "Create a hello.py with a hello world program"
- **Code Generation**: "Generate a React component for a login form"
- **File Editing**: "Add error handling to the login function in auth.js"
- **Shell Commands**: "/npm install express"

## ⚙️ Configuration

### Model Selection
Choose between two powerful Perplexity models:
- `sonar-pro`: Optimized for general coding tasks
- `sonar-research`: Enhanced model for complex queries

### Mode Selection
- **Chat Mode**: Default mode for conversations
- **Agent Mode**: Enable for automatic file operations

### Commands
| Command | Description |
|---------|-------------|
| `Perplexity Pro AI Chat: Set API Key` | Configure your API key |
| `Perplexity Pro AI Chat: Open Chat` | Open chat sidebar |

## 📝 Important Notes

1. **API Key Security**: 
   - Stored securely using VS Code SecretStorage
   - Never exposed in settings or logs
2. **File Operations**: 
   - Agent mode requires confirmation for safety
   - Files created in current workspace
3. **Model Selection**:
   - Change models per conversation
   - Each optimized for different tasks

## 🆕 Latest Updates

### Version 1.3.0
- Enhanced UI with VS Code theme integration
- Improved file operation reliability
- Added sonar-pro and sonar-research models
- Better error handling and feedback
- Enhanced chat history persistence

### Version 1.2.0
- Added model selection dropdown
- Improved Agent mode reliability
- Enhanced markdown rendering

## 🤝 Contributing

Found a bug or have a suggestion? Please open an issue on our [GitHub repository](https://github.com/yourusername/vscode-perplexity-pro-chat).

## 📄 License

This extension is licensed under the MIT License.

## 🔐 Privacy Policy

This extension:
- Only sends queries to Perplexity when you submit them
- Stores only your API key (securely) and chat history
- Does not collect personal information
- Does not share workspace data without explicit action

## 🙋‍♂️ Support

Need help?
1. Check our [FAQ](https://github.com/yourusername/vscode-perplexity-pro-chat/wiki/FAQ)
2. Search [existing issues](https://github.com/yourusername/vscode-perplexity-pro-chat/issues)
3. Open a new issue if needed

---

**Enjoy coding with AI assistance!** 🚀
