import mongoose from "mongoose";

const studentTaskProgressSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "GroupTask", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
  },
  { timestamps: true }
);

studentTaskProgressSchema.index({ task: 1, student: 1 }, { unique: true });

export default mongoose.model("StudentTaskProgress", studentTaskProgressSchema);
