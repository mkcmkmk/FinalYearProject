import ClassSchedule from "../models/ClassSchedule.js";
import Group from "../models/Group.js";
import Subscription from "../models/Subscription.js";

const ensureTeacher = (req, res) => {
  if (req.user?.role !== "teacher") {
    res.status(403).json({ success: false, message: "Teacher access required" });
    return false;
  }

  return true;
};

const refreshGroupFill = async (groupId) => {
  const filled = await Subscription.countDocuments({ group: groupId });
  await Group.findByIdAndUpdate(groupId, { filled });
};

const dayOrder = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
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

const hasMatchingExpertise = (teacher, instrument) => {
  const expertiseList = getTeacherExpertiseList(teacher).map(normalizeInstrument);
  if (!expertiseList.length) {
    return false;
  }

  return expertiseList.includes(normalizeInstrument(instrument));
};

export const getTeacherDashboard = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;

    const teacherId = req.user._id;
    const teacherExpertiseList = getTeacherExpertiseList(req.user);

    const [allGroups, allTeacherSubscriptions, allUnassignedSubscriptions, allSchedules] =
      await Promise.all([
        Group.find({ teacher: teacherId }).sort({ groupName: 1 }).lean(),
        Subscription.find({ teacher: teacherId })
          .populate("user", "name email profileImage")
          .populate("group", "groupName instrument capacity filled")
          .sort({ updatedAt: -1 })
          .lean(),
        Subscription.find({
          status: { $in: ["active", "pending"] },
          $or: [{ teacher: null }, { teacher: { $exists: false } }],
        })
          .populate("user", "name email profileImage")
          .sort({ createdAt: -1 })
          .lean(),
        ClassSchedule.find({ teacher: teacherId }).lean(),
      ]);

    const groups = allGroups.filter((group) => hasMatchingExpertise(req.user, group.instrument));
    const teacherSubscriptions = allTeacherSubscriptions.filter((subscription) =>
      hasMatchingExpertise(req.user, subscription.instrument)
    );
    const unassignedSubscriptions = allUnassignedSubscriptions.filter((subscription) =>
      hasMatchingExpertise(req.user, subscription.instrument)
    );
    const schedules = allSchedules.filter((schedule) =>
      hasMatchingExpertise(req.user, schedule.instrument)
    );

    const groupedStudents = groups.map((group) => ({
      ...group,
      students: teacherSubscriptions.filter(
        (subscription) =>
          String(subscription.group?._id || subscription.group || "") === String(group._id)
      ),
    }));

    const studentPool = [
      ...teacherSubscriptions.map((subscription) => ({
        ...subscription,
        assignmentState: "assigned",
        currentGroupName:
          subscription.groupName || subscription.group?.groupName || "Unassigned",
      })),
      ...unassignedSubscriptions.map((subscription) => ({
        ...subscription,
        assignmentState: "unassigned",
        currentGroupName: "Unassigned",
      })),
    ];

    const sortedSchedules = [...schedules].sort((a, b) => {
      const dayDiff = (dayOrder[a.dayOfWeek] ?? 99) - (dayOrder[b.dayOfWeek] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return String(a.startTime).localeCompare(String(b.startTime));
    });

    return res.json({
      success: true,
      teacher: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profileImage: req.user.profileImage || "",
        instrumentExpertise: req.user.instrumentExpertise || "",
      },
      summary: {
        totalGroups: groups.length,
        totalStudents: teacherSubscriptions.length,
        unassignedStudents: unassignedSubscriptions.length,
        totalSchedules: sortedSchedules.length,
      },
      expertiseInstruments: teacherExpertiseList,
      groups: groupedStudents,
      studentPool,
      unassignedStudents: unassignedSubscriptions,
      schedules: sortedSchedules,
    });
  } catch (error) {
    console.error("getTeacherDashboard error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const assignStudentsToGroup = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;

    const { subscriptionIds, groupName, instrument, capacity } = req.body;
    const teacherExpertiseList = getTeacherExpertiseList(req.user);

    if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one student to assign",
      });
    }

    if (!groupName || !instrument) {
      return res.status(400).json({
        success: false,
        message: "Group name and instrument are required",
      });
    }

    if (!teacherExpertiseList.length) {
      return res.status(400).json({
        success: false,
        message: "Add your instrument expertise in your profile before assigning students",
      });
    }

    if (!hasMatchingExpertise(req.user, instrument)) {
      return res.status(400).json({
        success: false,
        message: "You can only assign students for your own instrument expertise",
      });
    }

    const normalizedGroupName = String(groupName).trim();
    const normalizedInstrument = String(instrument).trim();

    const group = await Group.findOneAndUpdate(
      { teacher: req.user._id, groupName: normalizedGroupName },
      {
        teacher: req.user._id,
        groupName: normalizedGroupName,
        instrument: normalizedInstrument,
        ...(capacity ? { capacity: Number(capacity) } : {}),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const allowedSubscriptions = await Subscription.find({
      _id: { $in: subscriptionIds },
      status: { $in: ["active", "pending"] },
      $or: [{ teacher: req.user._id }, { teacher: null }, { teacher: { $exists: false } }],
    }).select("_id group instrument");

    const expertiseMatchedSubscriptions = allowedSubscriptions.filter((subscription) =>
      hasMatchingExpertise(req.user, subscription.instrument)
    );

    if (!expertiseMatchedSubscriptions.length) {
      return res.status(400).json({
        success: false,
        message: "No eligible students were found for your instrument expertise",
      });
    }

    const allowedIds = expertiseMatchedSubscriptions.map((subscription) => subscription._id);

    await Subscription.updateMany(
      { _id: { $in: allowedIds } },
      {
        teacher: req.user._id,
        group: group._id,
        groupName: group.groupName,
        instrument: normalizedInstrument,
      }
    );

    const previousGroupIds = expertiseMatchedSubscriptions
      .map((subscription) => subscription.group)
      .filter(Boolean)
      .map((id) => String(id));

    await refreshGroupFill(group._id);
    await Promise.all(
      [...new Set(previousGroupIds)]
        .filter((id) => id !== String(group._id))
        .map((id) => refreshGroupFill(id))
    );

    return res.json({
      success: true,
      message: "Students assigned successfully",
      group,
    });
  } catch (error) {
    console.error("assignStudentsToGroup error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createClassSchedule = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;

    const { groupId, dayOfWeek, startTime, endTime, room, notes } = req.body;

    if (!groupId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Group, day, start time and end time are required",
      });
    }

    const group = await Group.findOne({ _id: groupId, teacher: req.user._id });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found for this teacher",
      });
    }

    const schedule = await ClassSchedule.create({
      teacher: req.user._id,
      group: group._id,
      groupName: group.groupName,
      instrument: group.instrument,
      dayOfWeek,
      startTime,
      endTime,
      room: room || "",
      notes: notes || "",
    });

    return res.status(201).json({
      success: true,
      message: "Class schedule created",
      schedule,
    });
  } catch (error) {
    console.error("createClassSchedule error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const reassignStudentToGroup = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;

    const { subscriptionId, newGroupId } = req.body;
    const teacherId = req.user._id;

    if (!subscriptionId || !newGroupId) {
      return res.status(400).json({
        success: false,
        message: "Student subscription ID and target group ID are required",
      });
    }

    // Get the subscription to reassign
    const subscription = await Subscription.findById(subscriptionId)
      .populate("user", "name email")
      .populate("group", "groupName instrument filled capacity");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Student subscription not found",
      });
    }

    // Verify the teacher owns this subscription
    if (String(subscription.teacher) !== String(teacherId)) {
      return res.status(403).json({
        success: false,
        message: "You can only reassign your own students",
      });
    }

    // Get the new group
    const newGroup = await Group.findOne({ _id: newGroupId, teacher: teacherId });
    if (!newGroup) {
      return res.status(404).json({
        success: false,
        message: "Target group not found or does not belong to you",
      });
    }

    // Check if new group has capacity
    if (newGroup.filled >= newGroup.capacity) {
      return res.status(400).json({
        success: false,
        message: `Group "${newGroup.groupName}" is at full capacity (${newGroup.capacity}/${newGroup.capacity})`,
      });
    }

    // Check if instrument matches
    const normalizedNewInstrument = normalizeInstrument(newGroup.instrument);
    const normalizedSubInstrument = normalizeInstrument(subscription.instrument);
    
    if (normalizedNewInstrument !== normalizedSubInstrument) {
      return res.status(400).json({
        success: false,
        message: `Cannot reassign student to group with different instrument. Student: ${subscription.instrument}, Group: ${newGroup.instrument}`,
      });
    }

    const oldGroupId = subscription.group;

    // Update the subscription
    subscription.group = newGroup._id;
    subscription.groupName = newGroup.groupName;
    await subscription.save();

    // Update group fill counts
    await refreshGroupFill(newGroup._id);
    if (oldGroupId) {
      await refreshGroupFill(oldGroupId);
    }

    return res.json({
      success: true,
      message: `Student "${subscription.user?.name || "Student"}" reassigned to group "${newGroup.groupName}" successfully`,
      subscription,
      newGroup,
    });
  } catch (error) {
    console.error("reassignStudentToGroup error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
