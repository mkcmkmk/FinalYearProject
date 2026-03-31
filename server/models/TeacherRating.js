import mongoose from "mongoose";

const teacherRatingSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    ratingDateKey: {
      type: String,
      required: true,
      trim: true,
    },
    ratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

teacherRatingSchema.index({ teacher: 1, student: 1, ratingDateKey: 1 }, { unique: true });
teacherRatingSchema.index({ teacher: 1, createdAt: -1 });

const TeacherRating =
  mongoose.models.TeacherRating || mongoose.model("TeacherRating", teacherRatingSchema);

export default TeacherRating;
