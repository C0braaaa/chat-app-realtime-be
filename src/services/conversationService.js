import { conversationModel } from "#src/models/conversationModel.js";
import mongoose from "mongoose";

const createConversation = async (senderId, receiverId) => {
  const senderObjectId = new mongoose.Types.ObjectId(senderId);
  const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

  const conversation = await conversationModel.Conversation.findOne({
    type: "direct",
    participants: { $all: [senderObjectId, receiverObjectId] },
  });

  if (conversation) return conversation;

  const newConversation = await conversationModel.Conversation.create({
    type: "direct",
    participants: [senderObjectId, receiverObjectId], // Lưu ObjectId chuẩn luôn
    createdBy: senderObjectId,
  });
  return newConversation;
};

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
  if (!userId) return [];
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const conversations = await conversationModel.Conversation.find({
    participants: { $in: [userObjectId, userId] },
  })
    .populate("participants", "name avatar email")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  const filteredConversations = conversations.filter((conv) => {
    const deleteInfo = conv.deletedBy.find(
      (d) => d.userId.toString() === userId.toString(),
    );

    if (!deleteInfo) return true;
    if (!conv.lastMessage) return false;

    const lastMessageTime = new Date(
      conv.lastMessage.created_at || conv.lastMessage.createdAt,
    ).getTime();
    const deleteTime = new Date(deleteInfo.deletedAt).getTime();

    return lastMessageTime > deleteTime;
  });

  return filteredConversations;
};

const deleteConversationForUser = async (conversationId, userId) => {
  const conversation =
    await conversationModel.Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  // Kiểm tra xem user này đã từng xóa trước đó chưa
  const existingDeleteIndex = conversation.deletedBy.findIndex(
    (item) => item.userId.toString() === userId.toString(),
  );

  if (existingDeleteIndex !== -1) {
    // Nếu đã từng xóa, cập nhật lại thời gian xóa mới nhất
    conversation.deletedBy[existingDeleteIndex].deletedAt = new Date();
  } else {
    // Nếu chưa, thêm mới vào mảng
    conversation.deletedBy.push({ userId, deletedAt: new Date() });
  }

  await conversation.save();
  return conversation;
};
export const conversationService = {
  createConversation,
  createGroupConversation,
  getConversationsByUserId,
  deleteConversationForUser,
};
