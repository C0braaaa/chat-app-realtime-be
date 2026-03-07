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

  // Xử lý kết nối
  io.on("connection", (socket) => {
    // Join user vào phòng theo userId (để nhận thông báo call)
    if (socket.user?.userId) {
      socket.join(socket.user.userId);
    }

    // ─── CONVERSATION ───────────────────────────────────────────────────────
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // ─── CALL SIGNALING ──────────────────────────────────────────────────────
    // Bước 1: Người gọi bấm "Gọi" → emit incoming_call cho người nhận
    socket.on("call_user", ({ receiverId, callType, callerInfo, offer }) => {
      io.to(receiverId).emit("incoming_call", {
        callerId: socket.user.userId,
        callerInfo, // { name, avatar } để hiển thị UI
        callType, // "audio" | "video"
        offer, // WebRTC SDP offer
      });
    });

    // Bước 2a: Người nhận chấp nhận → trả answer về cho người gọi
    socket.on("call_accepted", ({ callerId, answer }) => {
      io.to(callerId).emit("call_accepted", { answer });
    });

    // Bước 2b: Người nhận từ chối → báo cho người gọi
    socket.on("call_declined", ({ callerId }) => {
      io.to(callerId).emit("call_declined", {
        reason: "Người dùng từ chối cuộc gọi",
      });
    });

    // Bước 3: Trao đổi ICE candidates (WebRTC handshake)
    socket.on("ice_candidate", ({ targetId, candidate }) => {
      io.to(targetId).emit("ice_candidate", {
        candidate,
        from: socket.user.userId,
      });
    });

    // Bước 4: Một trong hai bên kết thúc cuộc gọi
    socket.on("end_call", ({ targetId }) => {
      io.to(targetId).emit("call_ended", {
        from: socket.user.userId,
      });
    });

    // Bước 5 (optional): Người gọi không bắt máy → timeout
    socket.on("call_missed", ({ receiverId }) => {
      io.to(receiverId).emit("call_missed", {
        callerId: socket.user.userId,
      });
    });
  });

  return io;
}
