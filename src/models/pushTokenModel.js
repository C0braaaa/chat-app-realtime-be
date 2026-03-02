import mongoose from "mongoose";

const pushTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true, unique: true },
    deviceType: { type: String, enum: ["ios", "android", "web"] },
  },
  { timestamps: true },
);

// Index for faster queries
pushTokenSchema.index({ userId: 1, token: 1 });

export const PushToken = mongoose.model("PushToken", pushTokenSchema);
