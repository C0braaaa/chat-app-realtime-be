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

  // ─── WEBRTC SIGNALING ────────────────────────────────────────

  // Bước 1: A gọi cho B
  socket.on("call_user", async ({ to, offer, callType }) => {
    const callerId = socket.user.userId;

    // Lấy tên caller để hiện trên notification
    const caller =
      await userModel.User.findById(callerId).select("name avatar");

    // Báo cho B biết có cuộc gọi đến (nếu B đang online)
    io.to(to).emit("incoming_call", {
      from: callerId,
      callerName: caller?.name || "Ai đó",
      callerAvatar: caller?.avatar || "",
      offer,
      callType, // "video" hoặc "audio"
    });

    // Gửi Push Notification cho B (khi B không online)
    try {
      const tokenDoc = await PushToken.findOne({ userId: to });
      if (tokenDoc) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: tokenDoc.token,
            title: `📞 ${caller?.name || "Ai đó"} đang gọi cho bạn`,
            body: callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại",
            sound: "default",
            priority: "high",
            data: {
              type: "incoming_call",
              callerId: callerId.toString(),
              callerName: caller?.name || "",
              callerAvatar: caller?.avatar || "",
              callType,
            },
          }),
        });
      }
    } catch (err) {
      console.error("Push notification error:", err);
    }
  });

  // Bước 2: B chấp nhận cuộc gọi
  socket.on("accept_call", ({ to, answer }) => {
    io.to(to).emit("call_accepted", { answer });
  });

  // Bước 3: Từ chối cuộc gọi
  socket.on("reject_call", ({ to }) => {
    io.to(to).emit("call_rejected");
  });

  // Kết thúc cuộc gọi (cả 2 bên đều có thể emit)
  socket.on("end_call", ({ to }) => {
    io.to(to).emit("call_ended");
  });

  // ICE Candidates — trao đổi network info để thiết lập P2P
  socket.on("ice_candidate", ({ to, candidate }) => {
    io.to(to).emit("ice_candidate", { candidate });
  });

  return io;
}
