import { conversationService } from "#src/services/conversationService.js";

const createConversation = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      type,
      name,
      participants,
      avatar,
      createdBy,
    } = req.body;

    if (type === "group") {
      if (!participants || participants.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Nhóm phải có ít nhất 2 thành viên",
        });
      }
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm là bắt buộc",
        });
      }

      const conversation = await conversationService.createGroupConversation({
        name,
        participants,
        avatar,
        createdBy,
      });

      return res.status(200).json({
        success: true,
        message: "Tạo nhóm thành công!",
        data: conversation,
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "ID người nhận là bắt buộc",
      });
    }

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "ID người gửi là bắt buộc",
      });
    }

    const conversation = await conversationService.createConversation(
      senderId,
      receiverId,
    );

    res.status(200).json({
      success: true,
      message: "Tạo cuộc hội thoại thành công!",
      data: conversation,
    });
  } catch (error) {
    console.error("Lỗi tạo cuộc hội thoại:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tạo cuộc hội thoại",
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

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    await conversationService.deleteConversationForUser(conversationId, userId);

    res.status(200).json({ success: true, message: "Đã xóa cuộc hội thoại" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    await conversationService.deleteGroupByOwner(conversationId, userId);

    res.status(200).json({
      success: true,
      message: "Nhóm và tất cả dữ liệu liên quan đã bị xóa vĩnh viễn.",
    });
  } catch (error) {
    const status = error.message.includes("quyền") ? 403 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const conversationController = {
  createConversation,
  getConversations,
  deleteConversation,
  deleteGroup,
};
