import ClassSchedule from "../models/ClassSchedule.js";
import Group from "../models/Group.js";
import Subscription from "../models/Subscription.js";
import TeacherVerification from "../models/TeacherVerification.js";
import User from "../models/User.js";

const planPriceMap = {
  monthly: 2500,
  quarterly: 4000,
  yearly: 10000,
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
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }).select("-password").lean(),
      Subscription.find()
        .populate("user", "name email")
        .populate("teacher", "name email")
        .sort({ createdAt: -1 })
        .lean(),
      Group.find().populate("teacher", "name email").sort({ createdAt: -1 }).lean(),
      ClassSchedule.find().sort({ createdAt: -1 }).lean(),
      TeacherVerification.find().sort({ createdAt: -1 }).lean(),
      User.find({ role: "teacher" }).select("-password").lean(),
      User.find({ role: "student" }).select("-password").lean(),
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
      }

      await User.findByIdAndUpdate(verification.user, userUpdate);
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
