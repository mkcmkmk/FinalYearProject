import AdminNotice from "../models/AdminNotice.js";
import ChatMessage from "../models/ChatMessage.js";
import ClassSchedule from "../models/ClassSchedule.js";
import Group from "../models/Group.js";
import Subscription from "../models/Subscription.js";
import TeacherRating from "../models/TeacherRating.js";
import TeacherVerification from "../models/TeacherVerification.js";
import User from "../models/User.js";
import { sendTeacherApprovalEmail, sendTeacherRejectionEmail } from "../utils/emailUtils.js";

const planPriceMap = {
  monthly: 2500,
  quarterly: 4000,
  yearly: 10000,
};

const normalizeNoticeAudience = (value) => {
  const next = String(value || "")
    .trim()
    .toLowerCase();

  if (["all", "everyone", "users"].includes(next)) {
    return "all";
  }

  if (["student", "students", "student-only", "student_only"].includes(next)) {
    return "student";
  }

  if (["teacher", "teachers", "teacher-only", "teacher_only"].includes(next)) {
    return "teacher";
  }

  return null;
};

const monthLabel = (date) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });

const ensureAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return false;
  }

  return true;
};

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isMember: Boolean(user.isMember),
  isTeacher: Boolean(user.isTeacher),
  profileImage: user.profileImage || "",
  createdAt: user.createdAt,
});

const computeGrowth = (current, previous) => {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
};

const computeExpiry = (plan, fromDate = new Date()) => {
  const expires = new Date(fromDate);

  if (plan === "monthly") expires.setMonth(expires.getMonth() + 1);
  if (plan === "quarterly") expires.setMonth(expires.getMonth() + 3);
  if (plan === "yearly") expires.setFullYear(expires.getFullYear() + 1);

  return expires;
};

export const getAdminDashboard = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      users,
      subscriptions,
      groups,
      schedules,
      teacherVerifications,
      teachers,
      students,
      notices,
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }).select("-password").lean(),
      Subscription.find()
        .populate("user", "name email")
        .populate("teacher", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Group.find().populate("teacher", "name email").sort({ createdAt: -1 }).lean(),
      ClassSchedule.find().sort({ createdAt: -1 }).lean(),
      TeacherVerification.find().populate("user", "instrumentExpertise yearsOfExperience teacherBio").sort({ createdAt: -1 }).lean(),
      User.find({ role: "teacher" }).select("-password").lean(),
      User.find({ role: "student" }).select("-password").lean(),
      AdminNotice.find().sort({ isPinned: -1, createdAt: -1 }).populate("author", "name").lean(),
    ]);

    const activeSubscriptions = subscriptions.filter((item) => item.status === "active");
    const pendingSubscriptions = subscriptions.filter((item) => item.status === "pending");
    const pendingVerifications = teacherVerifications.filter((item) => item.status === "pending");

    const currentMonthUsers = users.filter((item) => new Date(item.createdAt) >= monthStart).length;
    const previousMonthUsers = users.filter(
      (item) => new Date(item.createdAt) >= previousMonthStart && new Date(item.createdAt) < monthStart
    ).length;

    const currentMonthTeachers = teachers.filter((item) => new Date(item.createdAt) >= monthStart).length;
    const previousMonthTeachers = teachers.filter(
      (item) => new Date(item.createdAt) >= previousMonthStart && new Date(item.createdAt) < monthStart
    ).length;

    const currentMonthSchedules = schedules.filter((item) => new Date(item.createdAt) >= monthStart).length;
    const previousMonthSchedules = schedules.filter(
      (item) => new Date(item.createdAt) >= previousMonthStart && new Date(item.createdAt) < monthStart
    ).length;

    const currentMonthPendingReviews = pendingVerifications.filter(
      (item) => new Date(item.createdAt) >= monthStart
    ).length;
    const previousMonthPendingReviews = pendingVerifications.filter(
      (item) => new Date(item.createdAt) >= previousMonthStart && new Date(item.createdAt) < monthStart
    ).length;

    const sixMonthBuckets = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: monthLabel(date),
        revenue: 0,
        enrollments: 0,
        newStudents: 0,
      };
    });

    subscriptions.forEach((subscription) => {
      const createdAt = new Date(subscription.createdAt);
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const bucket = sixMonthBuckets.find((entry) => entry.key === key);
      if (!bucket) return;

      bucket.enrollments += 1;
      bucket.revenue += subscription.amount || planPriceMap[subscription.plan] || 0;
    });

    students.forEach((student) => {
      const createdAt = new Date(student.createdAt);
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const bucket = sixMonthBuckets.find((entry) => entry.key === key);
      if (!bucket) return;

      bucket.newStudents += 1;
    });

    const paymentStatusMap = ["active", "pending", "expired", "none"].map((status) => ({
      name: status,
      value: subscriptions.filter((subscription) => subscription.status === status).length,
    }));

    const instrumentCounts = subscriptions.reduce((accumulator, subscription) => {
      const key = subscription.instrument || "Unspecified";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const instrumentDemand = Object.entries(instrumentCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const groupsOverview = groups
      .map((group) => ({
        id: group._id,
        groupName: group.groupName,
        instrument: group.instrument,
        capacity: group.capacity,
        filled: group.filled,
        teacherName: group.teacher?.name || "Unassigned",
      }))
      .sort((a, b) => b.filled - a.filled)
      .slice(0, 6);

    const recentSubscriptions = subscriptions.slice(0, 8).map((subscription) => ({
      id: subscription._id,
      userName: subscription.user?.name || "Unknown student",
      userEmail: subscription.user?.email || "No email",
      teacherName: subscription.teacher?.name || "Unassigned",
      plan: subscription.plan,
      instrument: subscription.instrument,
      status: subscription.status,
      amount: subscription.amount || planPriceMap[subscription.plan] || 0,
      createdAt: subscription.createdAt,
    }));

    const recentSchedules = schedules.slice(0, 6).map((schedule) => ({
      id: schedule._id,
      groupName: schedule.groupName,
      instrument: schedule.instrument,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
    }));

    const recentUsers = users.slice(0, 8).map(toSafeUser);

    const recentNotices = notices.slice(0, 6).map((notice) => ({
      id: notice._id,
      title: notice.title,
      message: notice.message,
      audience: notice.audience,
      isPinned: Boolean(notice.isPinned),
      isActive: Boolean(notice.isActive),
      authorName: notice.author?.name || "Admin",
      createdAt: notice.createdAt,
    }));

    return res.json({
      success: true,
      summary: {
        totalUsers: users.length,
        usersGrowth: computeGrowth(currentMonthUsers, previousMonthUsers),
        teachers: teachers.length,
        teachersGrowth: computeGrowth(currentMonthTeachers, previousMonthTeachers),
        activeClasses: schedules.length,
        classesGrowth: computeGrowth(currentMonthSchedules, previousMonthSchedules),
        pendingReviews: pendingVerifications.length,
        reviewsGrowth: computeGrowth(currentMonthPendingReviews, previousMonthPendingReviews),
        activeSubscriptions: activeSubscriptions.length,
        pendingSubscriptions: pendingSubscriptions.length,
        totalGroups: groups.length,
      },
      charts: {
        revenueByMonth: sixMonthBuckets.map(({ key, ...entry }) => entry),
        paymentStatus: paymentStatusMap,
        instrumentDemand,
        studentGrowth: sixMonthBuckets.map(({ month, newStudents }) => ({ month, newStudents })),
      },
      pendingTeacherVerifications: pendingVerifications.slice(0, 6),
      recentSubscriptions,
      groupsOverview,
      recentSchedules,
      recentUsers,
      recentNotices,
    });
  } catch (error) {
    console.error("getAdminDashboard error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const reviewTeacherVerification = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid review status" });
    }

    const verification = await TeacherVerification.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ success: false, message: "Verification request not found" });
    }

    verification.status = status;
    await verification.save();

    if (verification.user) {
      const userUpdate = {
        isTeacher: status === "approved",
        UpdatedAt: new Date(),
      };

      if (status === "approved") {
        userUpdate.role = "teacher";
        const cleanName = verification.name.replace(/\s+/g, '').toLowerCase();
        userUpdate.email = `harmoniq${cleanName}@gmail.com`;
      }

      await User.findByIdAndUpdate(verification.user, userUpdate);

      // Send Email Notification to Teacher
      if (status === "approved") {
        await sendTeacherApprovalEmail(verification.email, verification.name, userUpdate.email, "Test@123");
      } else if (status === "rejected") {
        await sendTeacherRejectionEmail(verification.email, verification.name);
      }
    }

    return res.json({ success: true, message: `Teacher request ${status}` });
  } catch (error) {
    console.error("reviewTeacherVerification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateSubscriptionStatus = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { status } = req.body;
    if (!["active", "pending", "expired", "none"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid subscription status" });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    const update = {
      status,
    };

    if (status === "active") {
      update.paidAt = new Date();
      update.expiresAt = computeExpiry(subscription.plan, new Date());
    }

    if (status === "expired" || status === "none") {
      update.expiresAt = new Date();
    }

    const updated = await Subscription.findByIdAndUpdate(subscription._id, update, {
      new: true,
    });

    if (updated?.user) {
      await User.findByIdAndUpdate(updated.user, {
        isMember: status === "active",
        UpdatedAt: new Date(),
      });
    }

    return res.json({ success: true, message: "Subscription updated", subscription: updated });
  } catch (error) {
    console.error("updateSubscriptionStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const removeUserAccount = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const targetUser = await User.findById(req.params.id).select("_id role name").lean();
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot remove your own admin account" });
    }

    if (targetUser.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "At least one admin account must remain" });
      }
    }

    if (targetUser.role === "teacher") {
      const teacherGroups = await Group.find({ teacher: targetUser._id }).select("_id").lean();
      const groupIds = teacherGroups.map((group) => group._id);

      await Promise.all([
        ClassSchedule.deleteMany({ teacher: targetUser._id }),
        ClassSchedule.deleteMany({ group: { $in: groupIds } }),
        ChatMessage.deleteMany({ sender: targetUser._id }),
        ChatMessage.deleteMany({ group: { $in: groupIds } }),
        TeacherVerification.deleteMany({ user: targetUser._id }),
        TeacherRating.deleteMany({ teacher: targetUser._id }),
        Subscription.updateMany(
          { teacher: targetUser._id },
          {
            $set: {
              teacher: null,
              group: null,
              groupName: "",
              status: "pending",
            },
          }
        ),
        Group.deleteMany({ teacher: targetUser._id }),
      ]);
    } else {
      await Promise.all([
        Subscription.deleteMany({ user: targetUser._id }),
        TeacherRating.deleteMany({ student: targetUser._id }),
        ChatMessage.deleteMany({ sender: targetUser._id }),
        TeacherVerification.deleteMany({ user: targetUser._id }),
      ]);
    }

    await User.findByIdAndDelete(targetUser._id);

    return res.json({
      success: true,
      message: `${targetUser.name} has been removed successfully`,
    });
  } catch (error) {
    console.error("removeUserAccount error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createAdminNotice = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    const audience = normalizeNoticeAudience(req.body?.audience ?? "all");
    const isPinned = Boolean(req.body?.isPinned);

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    if (!audience) {
      return res.status(400).json({ success: false, message: "Invalid notice audience" });
    }

    const notice = await AdminNotice.create({
      title,
      message,
      audience,
      isPinned,
      author: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Notice published successfully",
      notice,
    });
  } catch (error) {
    console.error("createAdminNotice error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const removeAdminNotice = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const notice = await AdminNotice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }

    return res.json({ success: true, message: "Notice removed successfully" });
  } catch (error) {
    console.error("removeAdminNotice error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


