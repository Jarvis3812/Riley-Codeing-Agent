import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('rileyAI.openChat', () => {
      const panel = vscode.window.createWebviewPanel(
        'rileyAIChat',
        'Riley AI Chat',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async message => {
        if (message.command === 'sendMessage') {
          const userText = message.text;

          // TODO: Replace below with real async call to your AI backend (Ollama, Riley API, etc)
          const reply = `Riley AI Response to: "${userText}"`;

          panel.webview.postMessage({ command: 'newMessage', text: reply });
        }
      });
    })
  );
}

export function deactivate() {}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          margin: 0; padding: 10px;
          background-color: #1e1e1e;
          color: #ccc;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        #messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 10px;
          border: 1px solid #444;
          border-radius: 5px;
          background-color: #252526;
        }
        #inputArea {
          display: flex;
          margin-top: 10px;
        }
        #input {
          flex-grow: 1;
          padding: 8px;
          font-size: 14px;
          border-radius: 4px;
          border: 1px solid #444;
          background-color: #1e1e1e;
          color: white;
        }
        button {
          margin-left: 10px;
          padding: 8px 16px;
          background-color: #0e639c;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-weight: bold;
        }
        button:hover {
          background-color: #1177cc;
        }
        .message {
          margin-bottom: 10px;
          padding: 8px;
          border-radius: 4px;
        }
        .userMessage {
          background-color: #007acc;
          color: white;
          align-self: flex-end;
          max-width: 80%;
        }
        .rileyMessage {
          background-color: #3c3c3c;
          color: #ccc;
          align-self: flex-start;
          max-width: 80%;
        }
      </style>
    </head>
    <body>
      <div id="messages"></div>
      <div id="inputArea">
        <input id="input" type="text" placeholder="Type a message..." />
        <button id="sendBtn">Send</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const messages = document.getElementById('messages');
        const input = document.getElementById('input');
        const sendBtn = document.getElementById('sendBtn');

        function appendMessage(text, isUser) {
          const div = document.createElement('div');
          div.textContent = text;
          div.className = 'message ' + (isUser ? 'userMessage' : 'rileyMessage');
          messages.appendChild(div);
          messages.scrollTop = messages.scrollHeight;
        }

        sendBtn.onclick = () => {
          const text = input.value.trim();
          if (!text) return;
          appendMessage(text, true);
          vscode.postMessage({ command: 'sendMessage', text });
          input.value = '';
          input.focus();
        };

        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'newMessage') {
            appendMessage(message.text, false);
          }
        });

        input.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            sendBtn.click();
          }
        });

        input.focus();
      </script>
    </body>
    </html>
  `;
}
