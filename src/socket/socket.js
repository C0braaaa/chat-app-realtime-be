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
      socket.user = decoded; // Lưu info user vào socket
      next();
    });
  });

  // Xử lý kết nối
  io.on("connection", (socket) => {
    console.log("User connected:", socket.user?.userId);

    // Join user vào phòng theo ID của họ (để chat riêng sau này)
    if (socket.user?.userId) {
      socket.join(socket.user.userId);
    }
  });

  return io; // 👈 QUAN TRỌNG: Phải return để server.js dùng
}
