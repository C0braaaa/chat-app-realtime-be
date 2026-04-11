import { conversationModel } from "#src/models/conversationModel.js";
import { messageModel } from "#src/models/messageModel.js";
import { userModel } from "#src/models/userModel.js";
import { env } from "#src/config/environment.js";
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
    participants: [senderObjectId, receiverObjectId],
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

const getConversationById = async (conversationId) => {
  const conversation = await conversationModel.Conversation.findById(
    conversationId,
  ).populate("participants", "name avatar");
  if (!conversation) throw new Error("Không tìm thấy cuộc hội thoại");
  return conversation;
};

const deleteConversationForUser = async (conversationId, userId) => {
  const conversation =
    await conversationModel.Conversation.findById(conversationId);
  if (!conversation) throw new Error("Không tìm thấy cuộc hội thoại");

  const existingDeleteIndex = conversation.deletedBy.findIndex(
    (item) => item.userId.toString() === userId.toString(),
  );

  if (existingDeleteIndex !== -1) {
    conversation.deletedBy[existingDeleteIndex].deletedAt = new Date();
  } else {
    conversation.deletedBy.push({ userId, deletedAt: new Date() });
  }

  await conversation.save();
  return conversation;
};

const deleteGroupByOwner = async (conversationId, userId) => {
  const conversation =
    await conversationModel.Conversation.findById(conversationId);

  if (!conversation) throw new Error("Không tìm thấy cuộc hội thoại");

  if (conversation.type !== "group") {
    throw new Error("Hành động này chỉ dành cho cuộc hội thoại nhóm");
  }

  if (conversation.createdBy.toString() !== userId.toString()) {
    throw new Error(
      "Bạn không có quyền xóa nhóm này. Chỉ chủ nhóm mới có thể thực hiện.",
    );
  }

  await messageModel.Message.deleteMany({ conversationId });

  await conversationModel.Conversation.findByIdAndDelete(conversationId);

  return { success: true };
};

const updateConversationTheme = async (conversationId, themeKey) => {
  const conversation = await conversationModel.Conversation.findByIdAndUpdate(
    conversationId,
    { themeKey: themeKey },
    { returnDocument: "after" },
  );

  if (!conversation)
    throw new Error("Không tìm thấy cuộc hội thoại để cập nhật chủ đề");

  return conversation;
};

const getMentionSuggestions = async (conversationId, currentUserId) => {
  // Lấy thông tin bot từ DB
  const bot = await userModel.User.findById(env.BOT_USER_ID).select(
    "name avatar",
  );

  const conversation = await conversationModel.Conversation.findById(
    conversationId,
  ).populate("participants", "name avatar");

  if (!conversation) throw new Error("Không tìm thấy cuộc hội thoại");

  // Với chat 1-1: chỉ hiện bot
  if (conversation.type === "direct") {
    return bot ? [{ _id: bot._id, name: bot.name, avatar: bot.avatar, isBot: true }] : [];
  }

  // Với chat nhóm: bot + tất cả participants trừ bản thân
  const members = conversation.participants
    .filter((p) => p._id.toString() !== currentUserId.toString())
    .map((p) => ({ _id: p._id, name: p.name, avatar: p.avatar, isBot: false }));

  const result = [];
  if (bot) result.push({ _id: bot._id, name: bot.name, avatar: bot.avatar, isBot: true });
  result.push(...members);

  return result;
};

export const conversationService = {
  createConversation,
  createGroupConversation,
  getConversationsByUserId,
  getConversationById,
  deleteConversationForUser,
  deleteGroupByOwner,
  updateConversationTheme,
  getMentionSuggestions,
};
