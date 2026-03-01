import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["direct", "group"],
    required: true,
  },
  name: String,
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  deletedBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deletedAt: { type: Date, default: Date.now },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  avatar: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ConversationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (typeof next === "function") {
    next();
  }
});

ConversationSchema.index({ participants: 1 });
const Conversation = mongoose.model("Conversation", ConversationSchema);

export const conversationModel = {
  Conversation,
};
