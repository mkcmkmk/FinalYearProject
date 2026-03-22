import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    roomType: {
      type: String,
      enum: ["teachers", "group"],
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomType: 1, group: 1, createdAt: 1 });

const ChatMessage =
  mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
