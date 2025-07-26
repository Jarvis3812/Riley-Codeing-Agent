// ...existing code...

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Chat panel command
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
      // Chat message handler
      panel.webview.onDidReceiveMessage(async message => {
        if (message.command === 'sendMessage') {
          const userText = message.text;
          const contextText = await getWorkspaceContext();
          let prompt = userText;
          if (userText.startsWith('!explain')) {
            prompt = `Explain this code:\n${contextText}`;
          } else if (userText.startsWith('!refactor')) {
            prompt = `Refactor this code:\n${contextText}`;
          } else if (userText.startsWith('!edit')) {
            prompt = `Edit this code:\n${contextText}`;
          } else {
            prompt = `${userText}\n\nProject context:\n${contextText}`;
          }
          const reply = await sendPromptToLLM(prompt);
          panel.webview.postMessage({ command: 'newMessage', text: reply });
        } else if (message.command === 'insertCode') {
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            editor.edit(editBuilder => {
              editBuilder.insert(editor.selection.active, message.code);
            });
          }
        }
      });
    })
  );

  // Inline code completions (Copilot-style)
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, {
      async provideInlineCompletionItems(document, position) {
        const startLine = Math.max(0, position.line - 20);
        const endLine = Math.min(document.lineCount - 1, position.line + 20);
        let contextText = '';
        for (let i = startLine; i <= endLine; i++) {
          contextText += document.lineAt(i).text + '\n';
        }
        const prompt = `Complete the following code snippet:\n${contextText}\n---\nCompletion:`;
        const response = await sendPromptToLLM(prompt);
        return {
          items: [
            new vscode.InlineCompletionItem(response.trim(), new vscode.Range(position, position))
          ]
        };
      }
    })
  );
}
// End of file

export function deactivate() {}

// Workspace context: gather up to 5 code files
async function getWorkspaceContext(): Promise<string> {
  const files = await vscode.workspace.findFiles('**/*.{ts,js,py,cpp,java}', '**/node_modules/**');
  let contents: string[] = [];
  for (const file of files.slice(0, 5)) {
    const doc = await vscode.workspace.openTextDocument(file);
    const code = doc.getText().slice(0, 1000);
    contents.push(`File: ${file.fsPath}\n${code}`);
  }
  return contents.join('\n\n');
}

// LLM backend call
interface LLMResponse {
  response?: string;
}
async function sendPromptToLLM(prompt: string): Promise<string> {
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt,
        stream: false
      })
    });
    const data = (await res.json()) as LLMResponse;
    return data.response || 'No response';
  } catch (err: any) {
    return 'Error contacting LLM backend: ' + err.message;
  }
}

// Enhanced Webview HTML for chat, code insertion, and history
function getWebviewContent() {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <style>',
    '    body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 10px; background-color: #1e1e1e; color: #ccc; display: flex; flex-direction: column; height: 100vh; }',
    '    #messages { flex-grow: 1; overflow-y: auto; padding: 10px; border: 1px solid #444; border-radius: 5px; background-color: #252526; }',
    '    #inputArea { display: flex; margin-top: 10px; }',
    '    #input { flex-grow: 1; padding: 8px; font-size: 14px; border-radius: 4px; border: 1px solid #444; background-color: #1e1e1e; color: white; }',
    '    button { margin-left: 10px; padding: 8px 16px; background-color: #0e639c; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: bold; }',
    '    button:hover { background-color: #1177cc; }',
    '    .message { margin-bottom: 10px; padding: 8px; border-radius: 4px; }',
    '    .userMessage { background-color: #007acc; color: white; align-self: flex-end; max-width: 80%; }',
    '    .rileyMessage { background-color: #3c3c3c; color: #ccc; align-self: flex-start; max-width: 80%; }',
    '    .codeBlock { background: #222; color: #b5e853; font-family: monospace; padding: 8px; border-radius: 4px; margin: 8px 0; white-space: pre-wrap; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div id="messages"></div>',
    '  <div id="inputArea">',
    '    <input id="input" type="text" placeholder="Type a message..." />',
    '    <button id="sendBtn">Send</button>',
    '  </div>',
    '  <script>',
    '    const vscode = acquireVsCodeApi();',
    '    const messages = document.getElementById("messages");',
    '    const input = document.getElementById("input");',
    '    const sendBtn = document.getElementById("sendBtn");',
    '    let chatHistory = [];',
    '    function appendMessage(text, isUser) {',
    '      const div = document.createElement("div");',
    '      div.className = "message " + (isUser ? "userMessage" : "rileyMessage");',
    '      // Detect code blocks and render with style',
    '      if (!isUser && text.includes("```")) {',
    '        const parts = text.split("```");',
    '        div.innerHTML = "";',
    '        for (let i = 0; i < parts.length; i++) {',
    '          if (i % 2 === 0) {',
    '            div.innerHTML += `<span>${parts[i]}</span>`;',
    '          } else {',
    '            div.innerHTML += `<div class=\'codeBlock\'>${parts[i]}</div><button onclick=\'window.insertCodeBlock(${i})\'>Insert to Editor</button>`;',
    '          }',
    '        }',
    '      } else {',
    '        div.textContent = text;',
    '      }',
    '      messages.appendChild(div);',
    '      messages.scrollTop = messages.scrollHeight;',
    '      chatHistory.push({ text, isUser });',
    '    }',
    '    sendBtn.onclick = () => {',
    '      const text = input.value.trim();',
    '      if (!text) return;',
    '      appendMessage(text, true);',
    '      vscode.postMessage({ command: "sendMessage", text });',
    '      input.value = "";',
    '      input.focus();',
    '    };',
    '    window.addEventListener("message", event => {',
    '      const message = event.data;',
    '      if (message.command === "newMessage") {',
    '        appendMessage(message.text, false);',
    '      }',
    '    });',
    '    input.addEventListener("keydown", event => {',
    '      if (event.key === "Enter") {',
    '        sendBtn.click();',
    '      }',
    '    });',
    '    input.focus();',
    '    // Insert code block from chat to editor',
    '    window.insertCodeBlock = function(idx) {',
    '      const code = document.querySelectorAll(".codeBlock")[Math.floor(idx/2)].textContent;',
    '      vscode.postMessage({ command: "insertCode", code });',
    '    }',
    '  </script>',
    '</body>',
    '</html>'
  ].join('\n');
}
