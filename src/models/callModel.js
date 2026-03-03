import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["audio", "video"],
      default: "video",
    },
    status: {
      type: String,
      enum: ["missed", "completed", "declined"],
      required: true,
    },
    duration: {
      type: Number,
      default: 0, // Tính bằng giây
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Call = mongoose.model("Call", callSchema);

export const callModel = {
  Call,
};