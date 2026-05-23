import mongoose from "mongoose";

const adminNoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    audience: {
      type: String,
      enum: ["all", "student", "teacher"],
      default: "all",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

adminNoticeSchema.index({ isActive: 1, audience: 1, createdAt: -1 });

const AdminNotice =
  mongoose.models.AdminNotice || mongoose.model("AdminNotice", adminNoticeSchema);

export default AdminNotice;
