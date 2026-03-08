import { Server as SocketIOServer } from "socket.io";
import { env } from "#src/config/environment.js";
import jwt from "jsonwebtoken";

export function initializeSocketServer(server) {
  const io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });

  // Middleware Auth
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Invalid token"));
      socket.user = decoded;
      next();
    });
  });

  io.on("connection", (socket) => {
    if (socket.user?.userId) {
      socket.join(socket.user.userId);
    }

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
    });
  });

  return io;
}
