import { Server as SocketIOServer } from "socket.io";
import { env } from "#src/config/environment.js";
import { PushToken } from "#src/models/pushTokenModel.js";
import { userModel } from "#src/models/userModel.js";
import { messageModel } from "#src/models/messageModel.js";
import { conversationModel } from "#src/models/conversationModel.js";
import jwt from "jsonwebtoken";

// ─── Helper: format giây → "X phút Y giây" ───────────────────────────────────
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m} phút${s > 0 ? " " + s + " giây" : ""}`;
  return `${s} giây`;
}

// ─── Helper: lưu call message vào DB và emit real-time ───────────────────────
async function saveCallMessage(
  io,
  { callerId, receiverId, conversationId, callType, status, duration },
) {
  try {
    let convId = conversationId;
    if (!convId) {
      const conv = await conversationModel.Conversation.findOne({
        type: "direct",
        participants: { $all: [callerId, receiverId] },
      });
      if (!conv) return;
      convId = conv._id;
    }

    const durationText = duration > 0 ? formatDuration(duration) : "";
    const statusText =
      status === "missed"
        ? "Đã bỏ lỡ cuộc gọi thoại"
        : status === "rejected"
          ? "Cuộc gọi bị từ chối"
          : callType === "video"
            ? `Cuộc gọi video${durationText ? " · " + durationText : ""}`
            : `Cuộc gọi thoại${durationText ? " · " + durationText : ""}`;

    const callMessage = await messageModel.Message.create({
      conversationId: convId,
      senderId: callerId,
      content: statusText,
      type: "call",
      callInfo: { callType, status, duration },
    });

    await conversationModel.Conversation.findByIdAndUpdate(convId, {
      lastMessage: callMessage._id,
      updatedAt: new Date(),
    });

    const populated = await callMessage.populate("senderId", "name avatar");

    io.to(convId.toString()).emit("new_message", populated);
    io.to(callerId.toString()).emit("update_last_message", {
      conversationId: convId,
      lastMessage: populated,
    });
    io.to(receiverId.toString()).emit("update_last_message", {
      conversationId: convId,
      lastMessage: populated,
    });

    return populated;
  } catch (err) {
    console.error("saveCallMessage error:", err);
  }
}

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

      io.to(to).emit("incoming_call", {
        from: callerId,
        callerName: caller?.name || "Ai đó",
        callerAvatar: caller?.avatar || "",
        offer,
        callType,
        conversationId,
      });

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

    // B chấp nhận → emit startTime cho A
    socket.on("accept_call", ({ to, answer }) => {
      io.to(to).emit("call_accepted", { answer });
      const startTime = Date.now();
      socket.callStartTime = startTime;
      io.to(to).emit("call_start_time", { startTime });
    });

    // A nhận startTime từ server
    socket.on("store_start_time", ({ startTime }) => {
      socket.callStartTime = startTime;
    });

    // B từ chối → lưu "Cuộc gọi nhỡ" (người gọi là A = to)
    socket.on("reject_call", async ({ to, conversationId, callType }) => {
      io.to(to).emit("call_rejected");
      await saveCallMessage(io, {
        callerId: to,
        receiverId: socket.user.userId,
        conversationId,
        callType: callType || "audio",
        status: "missed",
        duration: 0,
      });
    });

    // Kết thúc cuộc gọi → tính duration, lưu tin nhắn
    socket.on(
      "end_call",
      async ({ to, conversationId, callType, startTime }) => {
        io.to(to).emit("call_ended");
        const start = startTime || socket.callStartTime;
        const duration = start ? Math.floor((Date.now() - start) / 1000) : 0;
        await saveCallMessage(io, {
          callerId: socket.user.userId,
          receiverId: to,
          conversationId,
          callType: callType || "audio",
          status: duration > 0 ? "ended" : "missed",
          duration,
        });
      },
    );

    socket.on("ice_candidate", ({ to, candidate }) => {
      io.to(to).emit("ice_candidate", { candidate });
    });
  });

  return io;
}
