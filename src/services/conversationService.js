import { conversationModel } from "#src/models/conversationModel.js";

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
  getConversationsByUserId,
};
