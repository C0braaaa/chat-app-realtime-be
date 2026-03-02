import { messageService } from "#src/services/messageService.js";
import { conversationModel } from "#src/models/conversationModel.js";
import { getBotResponse } from "#src/services/aiService.js";
import { env } from "#src/config/environment.js";
import { PushToken } from "#src/models/pushTokenModel.js";

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, attachement, senderId } = req.body;

    // 1. Lưu tin nhắn vào Database
    const message = await messageService.sendMessage({
      senderId,
      conversationId,
      content,
      attachement,
    });

    // 2. Gửi Real-time qua Socket.io
    const io = req.app.get("socketio");
    io.to(conversationId.toString()).emit("new_message", message);

    const conversation =
      await conversationModel.Conversation.findById(conversationId);
    if (conversation) {
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("update_last_message", {
          conversationId,
          lastMessage: message,
        });
      });
    }

    // 3. Trả về phản hồi cho Client ngay lập tức
    res.status(200).json({ success: true, data: message });

    // 🚀 4. GỬI THÔNG BÁO ĐẨY (PUSH NOTIFICATION)
    // Chỉ gửi nếu người gửi không phải là Bot
    if (senderId !== env.BOT_USER_ID) {
      try {
        const receivers = conversation.participants.filter(
          (p) => p.toString() !== senderId.toString(),
        );

        const userTokens = await PushToken.find({ userId: { $in: receivers } });

        if (userTokens.length > 0) {
          const expoTokens = userTokens.map((t) => t.token);

          const pushPayload = {
            to: expoTokens,
            title:
              conversation.type === "group"
                ? conversation.name
                : message.senderId.name || "Tin nhắn mới",
            body: content || "Đã gửi một hình ảnh",
            sound: "default",
            priority: "high",
            badge: 1,
            // Data must be string key-value pairs for Expo
            data: {
              conversationId: conversationId.toString(),
              senderName: message.senderId.name || "Someone",
              messageId: message._id.toString(),
            },
            // Additional settings for better reliability
            ttl: 86400, // 24 hours
            channelId: "default",
          };

          const pushResponse = await fetch(
            "https://exp.host/--/api/v2/push/send",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(pushPayload),
            },
          );

          const pushResult = await pushResponse.json();

          if (!pushResponse.ok) {
            console.error("Expo push error:", pushResult);
          }
        } else {
          // no tokens, nothing to send
        }
      } catch (pushError) {
        console.error("Error sending notification:", pushError);
      }
    }

    // 5. XỬ LÝ CHATBOT (@bot)
    if (content && content.toLowerCase().includes("@bot")) {
      const userPrompt = content.replace(/@bot/gi, "").trim();

      const aiReply = await getBotResponse(userPrompt);

      const botMessage = await messageService.sendMessage({
        senderId: env.BOT_USER_ID,
        conversationId: conversationId,
        content: aiReply,
        attachement: null,
      });

      io.to(conversationId.toString()).emit("new_message", botMessage);

      if (conversation) {
        conversation.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit("update_last_message", {
            conversationId,
            lastMessage: botMessage,
          });
        });
      }
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    const { deleteMsg, newLastMessage } = await messageService.deleteMessage(
      messageId,
      userId,
    );

    const io = req.app.get("socketio");
    if (deleteMsg && deleteMsg.conversationId) {
      io.to(deleteMsg.conversationId.toString()).emit(
        "message_deleted",
        messageId,
      );
    }

    const conversation = await conversationModel.Conversation.findById(
      deleteMsg.conversationId,
    );

    if (conversation) {
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("update_last_message", {
          conversationId: deleteMsg.conversationId,
          lastMessage: newLastMessage,
        });
      });
    }
    res.status(200).json({ success: true, data: deleteMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, content } = req.body;

    const { updatedMsg, isLastMessage, conversation } =
      await messageService.editMessage(messageId, userId, content);

    const io = req.app.get("socketio");

    io.to(updatedMsg.conversationId.toString()).emit(
      "message_edited",
      updatedMsg,
    );

    if (isLastMessage) {
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("update_last_message", {
          conversationId: updatedMsg.conversationId,
          lastMessage: updatedMsg,
        });
      });
    }

    res.status(200).json({ success: true, data: updatedMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    const messages = await messageService.getMessages(conversationId, userId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const messageController = {
  sendMessage,
  getMessages,
  deleteMessage,
  editMessage,
};
