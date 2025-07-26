"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('rileyAI.openChat', () => {
        const panel = vscode.window.createWebviewPanel('rileyAIChat', 'Riley AI Chat', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            if (message.command === 'sendMessage') {
                const userText = message.text;
                // TODO: Replace below with real async call to your AI backend (Ollama, Riley API, etc)
                const reply = `Riley AI Response to: "${userText}"`;
                panel.webview.postMessage({ command: 'newMessage', text: reply });
            }
        }));
    }));
}
function deactivate() { }
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
//# sourceMappingURL=extension.js.map