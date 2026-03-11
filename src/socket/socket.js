import { Server as SocketIOServer } from "socket.io";
import { env } from "#src/config/environment.js";
import { PushToken } from "#src/models/pushTokenModel.js";
import { userModel } from "#src/models/userModel.js";
import { callHistoryService } from "#src/services/callHistory.js";
import jwt from "jsonwebtoken";

export function initializeSocketServer(server) {
  const io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });

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

    // ─── WEBRTC SIGNALING ─────────────────────────────────────────

    socket.on("call_user", async ({ to, offer, callType, conversationId }) => {
      const callerId = socket.user.userId;
      const caller =
        await userModel.User.findById(callerId).select("name avatar");

      // ✅ 1. Tạo call record — status mặc định "missed"
      let callRecord = null;
      try {
        callRecord = await callHistoryService.createCallRecord({
          conversationId,
          callerId,
          receiverId: to,
          callType,
        });
      } catch (err) {
        console.error("Lỗi tạo call record:", err);
      }

      const callId = callRecord?._id?.toString() || null;

      // ✅ 2. Gửi incoming_call kèm callId để receiver dùng khi accept/reject
      io.to(to).emit("incoming_call", {
        from: callerId,
        callerName: caller?.name || "Ai đó",
        callerAvatar: caller?.avatar || "",
        offer,
        callType,
        conversationId,
        callId, // 👈 receiver cần cái này
      });

      // ✅ 3. Trả callId về cho chính caller để dùng khi end_call
      socket.emit("call_initiated", { callId });

      // Push notification cho receiver
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
                conversationId: conversationId || "",
              },
            }),
          });
        }
      } catch (err) {
        console.error("Push notification error:", err);
      }
    });

    // ✅ Receiver chấp nhận → cập nhật startedAt
    socket.on("accept_call", async ({ to, answer, callId }) => {
      io.to(to).emit("call_accepted", { answer });

      if (callId) {
        try {
          await callHistoryService.markCallAccepted(callId);
        } catch (err) {
          console.error("Lỗi markCallAccepted:", err);
        }
      }
    });

    // ✅ Receiver từ chối → status = rejected
    socket.on("reject_call", async ({ to, callId }) => {
      io.to(to).emit("call_rejected");

      if (callId) {
        try {
          await callHistoryService.markCallRejected(callId);
        } catch (err) {
          console.error("Lỗi markCallRejected:", err);
        }
      }
    });

    // ✅ Kết thúc cuộc gọi → status = completed + tính duration
    socket.on("end_call", async ({ to, callId }) => {
      io.to(to).emit("call_ended");

      if (callId) {
        try {
          await callHistoryService.markCallEnded(callId);
        } catch (err) {
          console.error("Lỗi markCallEnded:", err);
        }
      }
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
      io.to(to).emit("ice_candidate", { candidate });
    });
  });

  return io;
}
