import ClassSchedule from "../models/ClassSchedule.js";
import Group from "../models/Group.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

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

const buildTeacherProfile = async (teacherId) => {
  const teacher = await User.findOne({ _id: teacherId, role: "teacher" })
    .select("-password")
    .lean();

  if (!teacher) {
    return null;
  }

  const [groups, assignedStudents, classSchedules] = await Promise.all([
    Group.find({ teacher: teacherId }).sort({ groupName: 1 }).lean(),
    Subscription.countDocuments({ teacher: teacherId, status: { $in: ["active", "pending"] } }),
    ClassSchedule.countDocuments({ teacher: teacherId }),
  ]);

  return {
    teacher: userResponse(teacher),
    summary: {
      groups: groups.length,
      assignedStudents,
      weeklyClasses: classSchedules,
    },
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

export const getMyTeacherProfile = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Teacher access required" });
    }

    const profile = await buildTeacherProfile(req.user._id);
    return res.json({ success: true, ...profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTeacherProfileById = async (req, res) => {
  try {
    const profile = await buildTeacherProfile(req.params.id);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    return res.json({ success: true, ...profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
