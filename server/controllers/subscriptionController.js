import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const syncExpiredSubscription = async (subscription) => {
  if (!subscription) {
    return null;
  }

  const isActiveLike = ["active", "pending"].includes(subscription.status);
  const hasExpired = subscription.expiresAt && new Date(subscription.expiresAt).getTime() <= Date.now();

  if (!isActiveLike || !hasExpired) {
    return subscription;
  }

  let query = Subscription.findByIdAndUpdate(
    subscription._id,
    {
      status: "expired",
      expiresAt: subscription.expiresAt,
    },
    { new: true }
  ).populate("teacher", "name email role profileImage");

  if (mongoose.modelNames().includes("Group")) {
    query = query.populate("group", "groupName instrument capacity filled");
  }

  const updated = await query.lean();

  if (updated?.user) {
    await User.findByIdAndUpdate(updated.user, {
      isMember: false,
      UpdatedAt: new Date(),
    });
  }

  return updated;
};

export const getMySubscription = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let q = Subscription.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("teacher", "name email role profileImage");

    if (mongoose.modelNames().includes("Group")) {
      q = q.populate("group", "groupName instrument capacity filled");
    }

    const sub = await q;
    const normalizedSub = await syncExpiredSubscription(sub);

    return res.json({ success: true, subscription: normalizedSub });
  } catch (err) {
    console.error("getMySubscription error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
