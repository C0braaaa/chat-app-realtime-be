import { messageModel } from "#src/models/messageModel.js";
import { conversationModel } from "#src/models/conversationModel.js";

const sendMessage = async ({
  senderId,
  conversationId,
  content,
  attachement,
}) => {
  const newMessage = await messageModel.Message.create({
    senderId,
    conversationId,
    content,
    attachement,
  });
  await conversationModel.Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: newMessage._id,
    updatedAt: new Date(),
  });
  const populateMessage = await newMessage.populate("senderId", "name avatar");
  return populateMessage;
};

const deleteMessage = async (messageId, userId) => {
  const message = await messageModel.Message.findById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.senderId.toString() !== userId)
    throw new Error("You not unauthorized to delete this message");
  await messageModel.Message.findByIdAndDelete(messageId);

  const newLastMessage = await messageModel.Message.findOne({
    conversationId: message.conversationId,
  })
    .sort({ created_at: -1 })
    .populate("senderId", "name avatar");
  await conversationModel.Conversation.findByIdAndUpdate(
    message.conversationId,
    { lastMessage: newLastMessage ? newLastMessage._id : null },
  );
  return { deleteMsg: message, newLastMessage };
};

const getMessages = async (conversationId, userId) => {
  const conversation =
    await conversationModel.Conversation.findById(conversationId);
  let deleteTime = 0;

  if (conversation) {
    const deleteInfo = conversation.deletedBy.find(
      (d) => d.userId.toString() === userId.toString(),
    );
    if (deleteInfo) deleteTime = new Date(deleteInfo.deletedAt).getTime();
  }

  let query = { conversationId };

  if (deleteTime > 0) {
    query.created_at = { $gt: new Date(deleteTime) };
  }

  const messsages = await messageModel.Message.find(query)
    .populate("senderId", "name avatar")
    .sort({ created_at: -1 });
  return messsages;
};
const editMessage = async (messageId, userId, newContent) => {
  const message = await messageModel.Message.findById(messageId);
  if (!message) throw new Error("Message not found");

  if (message.senderId.toString() !== userId)
    throw new Error("You are not authorized to edit this message");

  message.content = newContent;
  await message.save();

  const conversation = await conversationModel.Conversation.findById(
    message.conversationId,
  );
  const isLastMessage = conversation.lastMessage.toString() === messageId;

  const populatedMessage = await message.populate("senderId", "name avatar");

  return { updatedMsg: populatedMessage, isLastMessage, conversation };
};

export const messageService = {
  sendMessage,
  getMessages,
  deleteMessage,
  editMessage,
};
