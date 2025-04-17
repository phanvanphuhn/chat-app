const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/message");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");
  socket.emit("message", generateMessage("Welcome to the chat app"));
  socket.broadcast.emit(
    "message",
    generateMessage("A new user has joined the chat")
  );

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed", undefined);
    }
    io.emit("message", generateMessage(message));
    callback(undefined, message);
  });

  socket.on("sendLocation", (data, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(
        `https://google.com/maps?q=${data.latitude},${data.longitude}`
      )
    );
    callback("Location shared");
  });

  socket.on("disconnect", () => {
    io.emit("message", generateMessage("A user has left the chat"));
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
