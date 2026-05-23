import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import ClassSchedule from "../models/ClassSchedule.js";
import mongoose from "mongoose";

const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

export const getMySchedule = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let query = Subscription.findOne({
      user: req.user._id,
      status: { $in: ["active", "pending"] },
    })
      .sort({ createdAt: -1 })
      .populate("teacher", "name email role profileImage");

    if (mongoose.modelNames().includes("Group")) {
      query = query.populate("group", "groupName instrument capacity filled");
    }

    const subscription = await query;
    const normalizedSub = await syncExpiredSubscription(subscription);

    const groupId = normalizedSub?.group?._id || normalizedSub?.group || null;
    if (!normalizedSub || !groupId || !["active", "pending"].includes(normalizedSub.status)) {
      return res.json({
        success: true,
        subscription: normalizedSub,
        schedules: [],
      });
    }

    const schedules = await ClassSchedule.find({ group: groupId })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    const orderedSchedules = [...schedules].sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return String(a.startTime).localeCompare(String(b.startTime));
    });

    return res.json({
      success: true,
      subscription: {
        id: normalizedSub._id,
        instrument: normalizedSub.instrument,
        level: normalizedSub.level,
        status: normalizedSub.status,
        groupName: normalizedSub.group?.groupName || normalizedSub.groupName || "Not assigned",
        teacherName: normalizedSub.teacher?.name || "Unassigned",
      },
      schedules: orderedSchedules.map((schedule) => ({
        id: schedule._id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        groupName: schedule.groupName,
        instrument: schedule.instrument,
        room: schedule.room || "-",
        notes: schedule.notes || "-",
      })),
    });
  } catch (err) {
    console.error("getMySchedule error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
