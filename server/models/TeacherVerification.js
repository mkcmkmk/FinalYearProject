import mongoose from "mongoose";

const TeacherVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    document: {
      url: {
        type: String,
        required: true,
      },
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // 🆕 Added Fields:
    category: {
      type: String,
      enum: ["guitar", "vocal", "piano", "drums", "violin", "other"],
      required: true,
    },
    pricePerSession: {
      type: Number,
      required: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const TeacherVerificationModel = mongoose.model(
  "TeacherVerification",
  TeacherVerificationSchema
);

export default TeacherVerificationModel;
