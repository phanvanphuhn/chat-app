const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/message");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
const { SOCKET_EVENTS } = require("./constants/socketConstants");
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on(SOCKET_EVENTS.JOIN, ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit(
      SOCKET_EVENTS.MESSAGE,
      generateMessage("Welcome to the chat app")
    );
    socket.broadcast
      .to(user.room)
      .emit(
        SOCKET_EVENTS.MESSAGE,
        generateMessage(`${user.username} has joined the chat`)
      );
    callback();
  });

  socket.on(SOCKET_EVENTS.SEND_MESSAGE, (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed", undefined);
    }
    io.to(user.room).emit(
      SOCKET_EVENTS.MESSAGE,
      generateMessage(message, user.username)
    );
    callback(undefined, message);
  });

  socket.on(SOCKET_EVENTS.SEND_LOCATION, (data, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      SOCKET_EVENTS.LOCATION_MESSAGE,
      generateLocationMessage(
        `https://google.com/maps?q=${data.latitude},${data.longitude}`
      )
    );
    callback("Location shared");
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        SOCKET_EVENTS.MESSAGE,
        generateMessage(`${user.username} has left the chat`)
      );
      io.to(user.room).emit(SOCKET_EVENTS.ROOM_DATA, {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
