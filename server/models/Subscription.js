import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    plan: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },

    instrument: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "pending", "expired", "none"],
      default: "active",
    },

    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    groupName: { type: String, default: "" },

    paidAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
