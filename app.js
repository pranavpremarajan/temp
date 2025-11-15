const fs = require("fs");
const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const CHAT_FILE = path.join(__dirname, "chat_history.txt");
const ACCESS_CODE = "1234"; // <--- hardcoded login code

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

// --- AUTH PAGE ---
app.get("/auth", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Login</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { font-family:sans-serif; text-align:center; margin-top:50px; }
input { padding:10px; width:200px; }
button { padding:10px; margin-top:10px; cursor:pointer; }
</style>
</head>
<body>

<h2>Enter Access Code</h2>
<form action="/" method="GET">
    <input type="password" name="code" placeholder="Access code">
    <br>
    <button type="submit">Enter</button>
</form>

</body>
</html>
`);
});

// --- CHAT PAGE ---
app.get("/", (req, res) => {
    if (req.query.code !== ACCESS_CODE) {
        return res.redirect("/auth");
    }

    const history = loadHistory();

    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Chat</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<h2>Chat</h2>

<ul class="messages" id="messages">
    ${history.map(m => `<li>${m}</li>`).join("")}
</ul>

<textarea id="msg" rows="3" placeholder="Type message..."></textarea>
<button onclick="sendMsg()">Send</button>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    // ---- USER IDENTIFIER ----
    let USER_ID = localStorage.getItem("chat_id");
    if (!USER_ID) {
        USER_ID = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem("chat_id", USER_ID);
    }

    // ---- USER COLOR ----
    let USER_COLOR = localStorage.getItem("chat_color");
    if (!USER_COLOR) {
        USER_COLOR = "hsl(" + Math.floor(Math.random() * 360) + ", 70%, 60%)";
        localStorage.setItem("chat_color", USER_COLOR);
    }

    var socket = io();

    function sendMsg() {
        var text = document.getElementById("msg").value.trim();
        if (!text) return;

        socket.emit("message", {
            user: USER_ID,
            color: USER_COLOR,
            text: text
        });

        document.getElementById("msg").value = "";
    }

    socket.on("message", function(data) {
        var li = document.createElement("li");

        // Colored username tag
        var userSpan = document.createElement("span");
        userSpan.textContent = "[" + data.user + "] ";
        userSpan.style.color = data.color;
        userSpan.style.fontWeight = "bold";

        var msgSpan = document.createElement("span");
        msgSpan.textContent = data.text;

        li.appendChild(userSpan);
        li.appendChild(msgSpan);

        document.getElementById("messages").appendChild(li);

        var box = document.getElementById("messages");
        box.scrollTop = box.scrollHeight;
    });
</script>

</body>
</html>
`);
});

// --- SOCKET HANDLING ---
io.on("connection", socket => {
    socket.on("message", data => {
        const line = `[${data.user}] ${data.text}`;
        saveMessage(line);

        // Broadcast original data including color
        io.emit("message", {
            user: data.user,
            color: data.color,
            text: data.text
        });
    });
});

server.listen(3000, () =>
    console.log("Chat running at http://localhost:3000")
);
