import { conversationService } from "#src/services/conversationService.js";

const createConversation = async (req, res) => {
  try {
    // Lấy tất cả các trường có thể gửi lên
    const {
      senderId,
      receiverId,
      type,
      name,
      participants,
      avatar,
      createdBy,
    } = req.body;

    // 👉 TRƯỜNG HỢP 1: TẠO GROUP
    if (type === "group") {
      // Validate dữ liệu group
      if (!participants || participants.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Group must have at least 2 participants",
        });
      }
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Group name is required",
        });
      }

      // Gọi service tạo group
      const conversation = await conversationService.createGroupConversation({
        name,
        participants,
        avatar,
        createdBy,
      });

      return res.status(200).json({
        success: true,
        message: "Create group successfully!",
        data: conversation,
      });
    }

    // 👉 TRƯỜNG HỢP 2: TẠO DIRECT CHAT (Logic cũ)
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver id is required",
      });
    }

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "Sender id is required",
      });
    }

    const conversation = await conversationService.createConversation(
      senderId,
      receiverId,
    );

    res.status(200).json({
      success: true,
      message: "Create conversation successfully!",
      data: conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create conversation",
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.query;
    const conversations =
      await conversationService.getConversationsByUserId(userId);
    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const conversationController = {
  createConversation,
  getConversations,
};
