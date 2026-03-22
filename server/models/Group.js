import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    instrument: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 8,
      min: 1,
    },
    filled: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

groupSchema.index({ teacher: 1, groupName: 1 }, { unique: true });

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);

export default Group;
