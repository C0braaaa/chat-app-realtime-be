import { conversationModel } from "#src/models/conversationModel.js";

// Logic tạo chat đôi (Giữ nguyên)
const createConversation = async (senderId, receiverId) => {
  const conversation = await conversationModel.Conversation.findOne({
    type: "direct",
    participants: { $all: [senderId, receiverId] },
  });

  if (conversation) return conversation;

  const newConversation = await conversationModel.Conversation.create({
    type: "direct",
    participants: [senderId, receiverId],
    createdBy: senderId,
  });
  return newConversation;
};

// 👉 Logic tạo Group (THÊM MỚI HÀM NÀY)
const createGroupConversation = async (data) => {
  const newGroup = await conversationModel.Conversation.create({
    type: "group",
    name: data.name,
    participants: data.participants,
    avatar: data.avatar || "",
    createdBy: data.createdBy,
  });
  return newGroup;
};

const getConversationsByUserId = async (userId) => {
  const conversations = await conversationModel.Conversation.find({
    participants: { $in: [userId] },
  })
    .populate("participants", "name avatar email")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  return conversations;
};

export const conversationService = {
  createConversation,
  createGroupConversation, // Nhớ export hàm mới ra
  getConversationsByUserId,
};
