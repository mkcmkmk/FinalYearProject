// import Subscription from "../models/Subscription.js";

// // helper: compute expiry from plan
// const computeExpiry = (plan) => {
//   const now = new Date();
//   const expires = new Date(now);

//   if (plan === "monthly") expires.setMonth(expires.getMonth() + 1);
//   if (plan === "quarterly") expires.setMonth(expires.getMonth() + 3);
//   if (plan === "yearly") expires.setFullYear(expires.getFullYear() + 1);

//   return expires;
// };

// export const subscribe = async (req, res) => {
//   try {
//     const { plan, instrument } = req.body;

//     if (!plan || !instrument) {
//       return res.status(400).json({
//         success: false,
//         message: "Plan and instrument are required",
//       });
//     }

//     const allowedPlans = ["monthly", "quarterly", "yearly"];
//     if (!allowedPlans.includes(plan)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid plan",
//       });
//     }

//     // Create a subscription (for now: instantly active after "Pay Now")
//     const created = await Subscription.create({
//       user: req.user._id,
//       plan,
//       instrument,
//       status: "active",
//       paidAt: new Date(),
//       expiresAt: computeExpiry(plan),
//     });

//     const full = await Subscription.findById(created._id)
//       .populate("teacher", "name email role profileImage")
//       .populate("group", "groupName instrument capacity filled");

//     return res.status(201).json({
//       success: true,
//       subscription: full,
//       message: "Subscription created",
//     });
//   } catch (err) {
//     console.error("subscribe error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// export const getMySubscription = async (req, res) => {
//   try {
//     const sub = await Subscription.findOne({ user: req.user._id })
//       .sort({ createdAt: -1 })
//       .populate("teacher", "name email role profileImage")
//       .populate("group", "groupName instrument capacity filled");

//     return res.json({ success: true, subscription: sub });
//   } catch (err) {
//     console.error("getMySubscription error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };
import Subscription from "../models/Subscription.js";
import mongoose from "mongoose";

export const getMySubscription = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let q = Subscription.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("teacher", "name email role profileImage");

    // ✅ populate group ONLY if Group model exists in runtime
    if (mongoose.modelNames().includes("Group")) {
      q = q.populate("group", "groupName instrument capacity filled");
    }

    const sub = await q;

    return res.json({ success: true, subscription: sub });
  } catch (err) {
    console.error("getMySubscription error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
