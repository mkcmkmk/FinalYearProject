import mongoose from "mongoose";
import AdminNotice from "../models/AdminNotice.js";
import ClassSchedule from "../models/ClassSchedule.js";
import Group from "../models/Group.js";
import Subscription from "../models/Subscription.js";
import TeacherRating from "../models/TeacherRating.js";
import User from "../models/User.js";

const APP_TIME_ZONE = "Asia/Katmandu";

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

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

const normalizeInstrument = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getTeacherExpertiseList = (teacher) =>
  String(teacher?.instrumentExpertise || "")
    .split(/[,/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const matchesInstrumentExpertise = (teacher, instrument) => {
  if (!instrument) {
    return true;
  }

  const normalizedInstrument = normalizeInstrument(instrument);
  return getTeacherExpertiseList(teacher)
    .map(normalizeInstrument)
    .includes(normalizedInstrument);
};

const getTimeZoneMeta = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return {
    weekday: lookup.weekday,
    dateKey: `${lookup.year}-${lookup.month}-${lookup.day}`,
  };
};

const formatRating = (rating) => ({
  id: rating._id,
  score: rating.score,
  feedback: rating.feedback || "",
  ratedAt: rating.ratedAt || rating.updatedAt || rating.createdAt,
  student: rating.student
    ? {
        id: rating.student._id || rating.student.id,
        name: rating.student.name,
        profileImage: rating.student.profileImage || "",
      }
    : null,
});

const getAssignedTeacherSubscription = (studentId, teacherId) =>
  Subscription.findOne({
    user: studentId,
    teacher: teacherId,
    status: { $in: ["active", "pending"] },
  })
    .sort({ createdAt: -1 })
    .select("_id teacher instrument group groupName status")
    .lean();

const getTeacherRatingsData = async (teacherId, viewer = null) => {
  const teacherObjectId = new mongoose.Types.ObjectId(String(teacherId));
  const dateMeta = getTimeZoneMeta();

  const [summaryRows, recentRatings, assignedSubscription] = await Promise.all([
    TeacherRating.aggregate([
      { $match: { teacher: teacherObjectId } },
      {
        $group: {
          _id: "$teacher",
          averageRating: { $avg: "$score" },
          totalRatings: { $sum: 1 },
        },
      },
    ]),
    TeacherRating.find({ teacher: teacherId })
      .sort({ ratedAt: -1, updatedAt: -1 })
      .limit(5)
      .populate("student", "name profileImage")
      .lean(),
    viewer?.role === "student"
      ? getAssignedTeacherSubscription(viewer._id, teacherId)
      : Promise.resolve(null),
  ]);

  const summary = summaryRows[0] || null;
  const todayRating =
    viewer?.role === "student" && assignedSubscription
      ? await TeacherRating.findOne({
          teacher: teacherId,
          student: viewer._id,
          ratingDateKey: dateMeta.dateKey,
        })
          .populate("student", "name profileImage")
          .lean()
      : null;

  const isSaturday = dateMeta.weekday === "Saturday";
  const isAssignedStudent = Boolean(assignedSubscription);

  let viewerMessage = "Students can submit ratings every Saturday.";
  if (viewer?.role === "student") {
    if (!isAssignedStudent) {
      viewerMessage = "Only students assigned to this teacher can submit a rating.";
    } else if (!isSaturday) {
      viewerMessage = `Ratings open every Saturday. Today is ${dateMeta.weekday}.`;
    } else if (todayRating) {
      viewerMessage = "You have already rated this teacher today. You can still update your rating before the day ends.";
    } else {
      viewerMessage = "Ratings are open today. Share your feedback for this teacher.";
    }
  }

  return {
    averageRating: summary?.averageRating ? Number(summary.averageRating.toFixed(1)) : 0,
    totalRatings: summary?.totalRatings || 0,
    recentRatings: recentRatings.map(formatRating),
    viewer: {
      isAssignedStudent,
      isSaturday,
      canRate: Boolean(isAssignedStudent && isSaturday),
      ratingDateKey: dateMeta.dateKey,
      todayRating: todayRating ? formatRating(todayRating) : null,
      message: viewerMessage,
    },
  };
};

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  role: user.role,
  email: user.email,
  profileImage: user.profileImage || "",
  contactNumber: user.contactNumber ?? null,
  instrumentExpertise: user.instrumentExpertise || "",
  yearsOfExperience: user.yearsOfExperience ?? null,
  teacherBio: user.teacherBio || "",
  isMember: Boolean(user.isMember),
  isTeacher: Boolean(user.isTeacher),
  createdAt: user.createdAt,
  updatedAt: user.UpdatedAt || user.updatedAt || null,
});

const buildTeacherProfile = async (teacherId, viewer = null) => {
  const teacher = await User.findOne({ _id: teacherId, role: "teacher" })
    .select("-password")
    .lean();

  if (!teacher) {
    return null;
  }

  const [groups, assignedStudents, classSchedules, ratings] = await Promise.all([
    Group.find({ teacher: teacherId }).sort({ groupName: 1 }).lean(),
    Subscription.countDocuments({ teacher: teacherId, status: { $in: ["active", "pending"] } }),
    ClassSchedule.countDocuments({ teacher: teacherId }),
    getTeacherRatingsData(teacherId, viewer),
  ]);

  return {
    teacher: userResponse(teacher),
    summary: {
      groups: groups.length,
      assignedStudents,
      weeklyClasses: classSchedules,
    },
    ratings,
    groups: groups.map((group) => ({
      id: group._id,
      groupName: group.groupName,
      instrument: group.instrument,
      capacity: group.capacity,
      filled: group.filled,
    })),
  };
};

export const getMe = async (req, res) => {
  res.json({ success: true, user: userResponse(req.user) });
};

export const updateMe = async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      profileImage,
      instrumentExpertise,
      yearsOfExperience,
      teacherBio,
    } = req.body;

    const updates = {
      ...(name && { name }),
      ...(contactNumber !== undefined && { contactNumber }),
      ...(profileImage !== undefined && { profileImage }),
      UpdatedAt: new Date(),
    };

    if (req.user.role === "teacher") {
      if (instrumentExpertise !== undefined) updates.instrumentExpertise = String(instrumentExpertise || "").trim();
      if (yearsOfExperience !== undefined) {
        updates.yearsOfExperience = yearsOfExperience === "" || yearsOfExperience === null
          ? null
          : Number(yearsOfExperience);
      }
      if (teacherBio !== undefined) updates.teacherBio = String(teacherBio || "").trim();
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");

    res.json({ success: true, user: userResponse(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTeacherDirectory = async (req, res) => {
  try {
    const instrument = String(req.query.instrument || "").trim();
    const teachers = await User.find({ role: "teacher" }).select("-password").lean();
    const matchingTeachers = teachers.filter((teacher) => matchesInstrumentExpertise(teacher, instrument));

    if (!matchingTeachers.length) {
      return res.json({ success: true, teachers: [] });
    }

    const teacherIds = matchingTeachers.map((teacher) => teacher._id);
    const [groups, schedules, subscriptions, ratingRows] = await Promise.all([
      Group.find({ teacher: { $in: teacherIds } }).lean(),
      ClassSchedule.find({ teacher: { $in: teacherIds } }).lean(),
      Subscription.find({
        teacher: { $in: teacherIds },
        status: { $in: ["active", "pending"] },
      }).lean(),
      TeacherRating.aggregate([
        { $match: { teacher: { $in: teacherIds } } },
        {
          $group: {
            _id: "$teacher",
            averageRating: { $avg: "$score" },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
    ]);

    const ratingMap = Object.fromEntries(
      ratingRows.map((row) => [
        String(row._id),
        {
          averageRating: row?.averageRating ? Number(row.averageRating.toFixed(1)) : 0,
          totalRatings: row?.totalRatings || 0,
        },
      ])
    );

    const teachersWithSummary = matchingTeachers.map((teacher) => ({
      ...userResponse(teacher),
      summary: {
        groups: groups.filter((group) => String(group.teacher) === String(teacher._id)).length,
        weeklyClasses: schedules.filter((schedule) => String(schedule.teacher) === String(teacher._id)).length,
        assignedStudents: subscriptions.filter((subscription) => String(subscription.teacher) === String(teacher._id)).length,
      },
      ratings: ratingMap[String(teacher._id)] || { averageRating: 0, totalRatings: 0 },
    }));

    return res.json({ success: true, teachers: teachersWithSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const submitTeacherRating = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Student access required" });
    }

    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" }).select("_id").lean();
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const subscription = await getAssignedTeacherSubscription(req.user._id, teacher._id);
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "You can only rate your assigned teacher",
      });
    }

    const dateMeta = getTimeZoneMeta();
    if (dateMeta.weekday !== "Saturday") {
      return res.status(400).json({
        success: false,
        message: `Ratings are only open on Saturday. Today is ${dateMeta.weekday}.`,
      });
    }

    const score = Number(req.body?.score);
    const feedback = String(req.body?.feedback || "").trim();

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: "Please choose a rating from 1 to 5 stars",
      });
    }

    const rating = await TeacherRating.findOneAndUpdate(
      {
        teacher: teacher._id,
        student: req.user._id,
        ratingDateKey: dateMeta.dateKey,
      },
      {
        teacher: teacher._id,
        student: req.user._id,
        subscription: subscription._id,
        score,
        feedback: feedback.slice(0, 500),
        ratedAt: new Date(),
        ratingDateKey: dateMeta.dateKey,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )
      .populate("student", "name profileImage")
      .lean();

    const ratings = await getTeacherRatingsData(teacher._id, req.user);

    return res.json({
      success: true,
      message: "Teacher rating saved successfully",
      rating: formatRating(rating),
      ratings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyTeacherProfile = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Teacher access required" });
    }

    const profile = await buildTeacherProfile(req.user._id, req.user);
    return res.json({ success: true, ...profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTeacherProfileById = async (req, res) => {
  try {
    const profile = await buildTeacherProfile(req.params.id, req.user);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    return res.json({ success: true, ...profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAdminNotices = async (req, res) => {
  try {
    const viewerRole = normalizeRole(req.user?.role);
    const audience = viewerRole === "teacher" ? "teacher" : viewerRole === "student" ? "student" : null;

    if (!audience) {
      return res.json({ success: true, notices: [] });
    }

    const notices = await AdminNotice.find({ isActive: true })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(10)
      .populate("author", "name role")
      .lean();

    const filteredNotices = notices.filter((notice) => {
      const noticeAudience = normalizeNoticeAudience(notice.audience);
      return noticeAudience === "all" || noticeAudience === audience;
    });

    return res.json({
      success: true,
      notices: filteredNotices.map((notice) => ({
        id: notice._id,
        title: notice.title,
        message: notice.message,
        audience: normalizeNoticeAudience(notice.audience) || "all",
        isPinned: Boolean(notice.isPinned),
        createdAt: notice.createdAt,
        authorName: notice.author?.name || "Admin",
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

