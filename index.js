require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");

const { Server } = require("socket.io");
const io = new Server(8000, {
  cors: {
    origin: ["https://webrtc-main.vercel.app", "http://localhost:3000"], // Frontend URLs
    methods: ["GET", "POST"],
    credentials: true, // Enable if cookies or authentication tokens are needed
  },
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

app.use("/", (req, res) => {
  res.send("server is running ");
});

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});
