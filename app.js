const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const CHAT_FILE = path.join(__dirname, "chat_history.txt");

// Read history
function loadHistory() {
    if (!fs.existsSync(CHAT_FILE)) return [];
    return fs.readFileSync(CHAT_FILE, "utf8")
        .split("\n")
        .filter(line => line.trim() !== "");
}

// Append message
function saveMessage(msg) {
    fs.appendFileSync(CHAT_FILE, msg + "\n");
}

app.get("/", (req, res) => {
    const history = loadHistory();
    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>.</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family:sans-serif; }
.chat-box { border:1px solid #ccc;padding:10px;max-width:600px;margin:20px auto; }
.messages { list-style:none;padding:0;height:300px;overflow-y:auto;border:1px solid #ddd;margin-bottom:10px; }
.messages li { padding:5px;border-bottom:1px solid #eee; }
textarea { width:100%;padding:10px; }
button { padding:10px;margin-top:10px;cursor:pointer; }
</style>
</head>
<body>
<div class="chat-box">
<h2>.</h2>
<ul class="messages" id="messages">
${history.map(m => `<li>${m}</li>`).join("")}
</ul>

<textarea id="msg" rows="3" placeholder="Type message..."></textarea>
<button onclick="sendMsg()">Send</button>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    var socket = io();

    function sendMsg() {
        var m = document.getElementById("msg").value.trim();
        if (!m) return;
        socket.emit("message", m);
        document.getElementById("msg").value = "";
    }

    socket.on("message", function(msg) {
        var li = document.createElement("li");
        li.textContent = msg;
        document.getElementById("messages").appendChild(li);
        var box = document.getElementById("messages");
        box.scrollTop = box.scrollHeight;
    });
</script>
</body>
</html>
`);
});

io.on("connection", socket => {
    socket.on("message", msg => {
        saveMessage(msg);
        io.emit("message", msg); // send to everyone
    });
});

server.listen(3000, () => console.log("Chat running at http://localhost:3000"));
