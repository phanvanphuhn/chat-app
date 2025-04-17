const socket = io();

const messages = document.querySelector("#messages");
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const { SOCKET_EVENTS } = require("../../src/constants/socketConstants");

socket.on(SOCKET_EVENTS.MESSAGE, (message) => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    username: message.username,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
});

socket.on(SOCKET_EVENTS.LOCATION_MESSAGE, (message) => {
  const html = Mustache.render(locationTemplate, {
    url: message.url,
    username: message.username,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
});

const params = new URLSearchParams(location.search);
const username = params.get("username");
const room = params.get("room");

if (!username || !room) {
  alert("Please provide both username and room");
  location.href = "/";
}

document.querySelector("#send").addEventListener("click", () => {
  socket.emit(
    SOCKET_EVENTS.SEND_MESSAGE,
    document.querySelector("#message").value,
    (error, response) => {
      if (error) {
        return console.log(error);
      }
      console.log("The message was delivered: ", response);
    }
  );
  document.querySelector("#message").value = "";
});

document.querySelector("#send-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      SOCKET_EVENTS.SEND_LOCATION,
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (error) => {
        if (error) {
          return console.log(error);
        }
        console.log("Location shared");
      }
    );
  });
  document.querySelector("#send-location").disabled = true;
  setTimeout(() => {
    document.querySelector("#send-location").disabled = false;
  }, 5000);
});

socket.emit(SOCKET_EVENTS.JOIN, { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
