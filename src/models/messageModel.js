import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: String,
    attachement: String,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);
messageSchema.index({ conversationId: 1, created_at: 1 });
const Message = mongoose.model("Message", messageSchema);

export const messageModel = {
  Message,
};
