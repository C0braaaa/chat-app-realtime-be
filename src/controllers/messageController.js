import { messageService } from "#src/services/messageService.js";
import { conversationModel } from "#src/models/conversationModel.js";
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, attachement, senderId } = req.body;

    const message = await messageService.sendMessage({
      senderId,
      conversationId,
      content,
      attachement,
    });

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
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ success: false, message: error.message });
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
