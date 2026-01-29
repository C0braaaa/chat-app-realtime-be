import { conversationService } from "#src/services/conversationService.js";

const createConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

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
