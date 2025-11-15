const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// File where chat history is stored
const CHAT_FILE = path.join(__dirname, 'chat_history.txt');

// Middleware to parse URL-encoded data (for form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));  // For serving static files like CSS/JS

// Function to read chat history from the file
function readChatHistory() {
  if (fs.existsSync(CHAT_FILE)) {
    return fs.readFileSync(CHAT_FILE, 'utf8').split('\n').filter(line => line.trim() !== '');
  }
  return [];
}

// Function to write a new message to the chat file
function writeMessage(message) {
  fs.appendFileSync(CHAT_FILE, message + '\n');
}

// Serve the chat interface
app.get('/', (req, res) => {
  const chatHistory = readChatHistory();
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Minimal Chat</title>
        <style>
            body { font-family: Arial, sans-serif; }
            .chat-box { border: 1px solid #ccc; padding: 10px; max-width: 600px; margin: 20px auto; }
            .messages { list-style: none; padding: 0; height: 300px; overflow-y: scroll; margin-bottom: 10px; }
            .messages li { padding: 5px; border-bottom: 1px solid #eee; }
            .input-box { width: 100%; padding: 10px; border: 1px solid #ccc; }
            .button { padding: 10px 15px; margin-top: 10px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="chat-box">
            <h2>Chat</h2>
            <ul class="messages" id="messages">
                ${chatHistory.map(msg => `<li>${msg}</li>`).join('')}
            </ul>
            <textarea id="messageInput" class="input-box" rows="4" placeholder="Type your message..."></textarea>
            <button class="button" id="sendBtn">Send</button>
        </div>

        <script>
            document.getElementById('sendBtn').addEventListener('click', function() {
                var message = document.getElementById('messageInput').value.trim();
                if (message !== "") {
                    fetch('/send_message', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: 'message=' + encodeURIComponent(message)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === "success") {
                            var li = document.createElement('li');
                            li.textContent = message;
                            document.getElementById('messages').appendChild(li);
                            document.getElementById('messageInput').value = '';
                            document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
                        }
                    });
                }
            });

            // Automatically scroll to the bottom of the chat
            document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        </script>
    </body>
    </html>
  `;
  res.send(htmlContent);
});

// Handle new message submission
app.post('/send_message', (req, res) => {
  const message = req.body.message;
  if (message) {
    writeMessage(message);
  }
  res.json({ status: 'success' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
