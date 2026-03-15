// src/models/callHistoryModel.js
import mongoose from "mongoose";

const CallHistorySchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["missed", "rejected", "completed"],
      default: "missed",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // giây
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

CallHistorySchema.index({ conversationId: 1, created_at: -1 });
CallHistorySchema.index({ callerId: 1, created_at: -1 });
CallHistorySchema.index({ receiverId: 1, created_at: -1 });

const CallHistory = mongoose.model("CallHistory", CallHistorySchema);

export const callHistoryModel = { CallHistory };
