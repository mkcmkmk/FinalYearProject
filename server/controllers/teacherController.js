import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";
import ClassSchedule from "../models/ClassSchedule.js";
import Group from "../models/Group.js";
import GroupTask from "../models/GroupTask.js";
import Subscription from "../models/Subscription.js";

const ensureTeacher = (req, res) => {
  if (req.user?.role !== "teacher") {
    res.status(403).json({ success: false, message: "Teacher access required" });
    return false;
  }

  return true;
};

const ACTIVE_STATUSES = ["active", "pending"];

const refreshGroupFill = async (groupId) => {
  if (!groupId) return;

  const distinctUsers = await Subscription.distinct("user", {
    group: groupId,
    status: { $in: ACTIVE_STATUSES },
  });

  await Group.findByIdAndUpdate(groupId, { filled: distinctUsers.length });
};

const pickCanonicalSubscriptionPerUser = (subscriptions) => {
  const byUser = new Map();

  for (const subscription of subscriptions) {
    const userId = String(subscription.user?._id || subscription.user || "");
    if (!userId) continue;

    const existing = byUser.get(userId);
    if (!existing || new Date(subscription.updatedAt) > new Date(existing.updatedAt)) {
      byUser.set(userId, subscription);
    }
  }

  return byUser;
};

const syncUserGroupPlacements = async ({
  userIds,
  teacherId,
  instrument,
  groupId,
  groupName,
}) => {
  const uniqueUserIds = [...new Set(userIds.map((id) => String(id)).filter(Boolean))];
  if (!uniqueUserIds.length) return;

  const normalizedInstrument = String(instrument).trim();

  await Subscription.updateMany(
    {
      user: { $in: uniqueUserIds },
      instrument: normalizedInstrument,
      status: { $in: ACTIVE_STATUSES },
      $or: [{ teacher: teacherId }, { teacher: null }, { teacher: { $exists: false } }],
    },
    {
      teacher: teacherId,
      group: groupId,
      groupName,
      instrument: normalizedInstrument,
    }
  );
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

    let groups = allGroups.filter((group) => hasMatchingExpertise(req.user, group.instrument));
    const teacherSubscriptions = allTeacherSubscriptions.filter((subscription) =>
      hasMatchingExpertise(req.user, subscription.instrument)
    );
    const unassignedSubscriptions = allUnassignedSubscriptions.filter((subscription) =>
      hasMatchingExpertise(req.user, subscription.instrument)
    );
    const schedules = allSchedules.filter((schedule) =>
      hasMatchingExpertise(req.user, schedule.instrument)
    );

    const canonicalAssignedByUser = pickCanonicalSubscriptionPerUser(teacherSubscriptions);
    const canonicalUnassignedByUser = pickCanonicalSubscriptionPerUser(unassignedSubscriptions);

    const userGroupIds = new Map();
    let hasSplitPlacements = false;

    for (const subscription of teacherSubscriptions) {
      const userId = String(subscription.user?._id || subscription.user || "");
      const groupId = String(subscription.group?._id || subscription.group || "");
      if (!userId || !groupId) continue;

      if (userGroupIds.has(userId) && userGroupIds.get(userId) !== groupId) {
        hasSplitPlacements = true;
        break;
      }

      userGroupIds.set(userId, groupId);
    }

    if (hasSplitPlacements) {
      await Promise.all(
        [...canonicalAssignedByUser.values()].map((subscription) => {
          const groupId = subscription.group?._id || subscription.group;
          if (!groupId) return Promise.resolve();

          return syncUserGroupPlacements({
            userIds: [subscription.user?._id || subscription.user],
            teacherId,
            instrument: subscription.instrument,
            groupId,
            groupName: subscription.groupName || subscription.group?.groupName || "",
          });
        })
      );

      await Promise.all(groups.map((group) => refreshGroupFill(group._id)));

      const refreshedGroups = await Group.find({ teacher: teacherId }).sort({ groupName: 1 }).lean();
      groups = refreshedGroups.filter((group) => hasMatchingExpertise(req.user, group.instrument));
    }

    const groupedStudents = groups.map((group) => ({
      ...group,
      students: [...canonicalAssignedByUser.values()].filter(
        (subscription) =>
          String(subscription.group?._id || subscription.group || "") === String(group._id)
      ),
    }));

    const studentPool = [
      ...[...canonicalAssignedByUser.values()].map((subscription) => ({
        ...subscription,
        assignmentState: "assigned",
        currentGroupName:
          subscription.groupName || subscription.group?.groupName || "Unassigned",
      })),
      ...[...canonicalUnassignedByUser.values()].map((subscription) => ({
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
        totalStudents: canonicalAssignedByUser.size,
        unassignedStudents: canonicalUnassignedByUser.size,
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
    }).select("_id user group instrument");

    const expertiseMatchedSubscriptions = allowedSubscriptions.filter((subscription) =>
      hasMatchingExpertise(req.user, subscription.instrument)
    );

    if (!expertiseMatchedSubscriptions.length) {
      return res.status(400).json({
        success: false,
        message: "No eligible students were found for your instrument expertise",
      });
    }

    const userIds = expertiseMatchedSubscriptions.map((subscription) => subscription.user);
    const groupCapacity = group.capacity || 8;
    const usersAlreadyInGroup = await Subscription.distinct("user", {
      group: group._id,
      status: { $in: ACTIVE_STATUSES },
    });
    const usersAlreadySet = new Set(usersAlreadyInGroup.map(String));
    const newUserIds = userIds.filter((id) => !usersAlreadySet.has(String(id)));

    if (usersAlreadyInGroup.length + newUserIds.length > groupCapacity) {
      const slotsLeft = Math.max(0, groupCapacity - usersAlreadyInGroup.length);
      return res.status(400).json({
        success: false,
        message: `Group "${normalizedGroupName}" is at full capacity (${usersAlreadyInGroup.length}/${groupCapacity}). Only ${slotsLeft} slot(s) remaining.`,
      });
    }

    const subscriptionsBeforeAssign = await Subscription.find({
      user: { $in: userIds },
      instrument: normalizedInstrument,
      status: { $in: ACTIVE_STATUSES },
      $or: [{ teacher: req.user._id }, { teacher: null }, { teacher: { $exists: false } }],
    }).select("group");

    const previousGroupIds = subscriptionsBeforeAssign
      .map((subscription) => subscription.group)
      .filter(Boolean)
      .map((id) => String(id));

    await syncUserGroupPlacements({
      userIds,
      teacherId: req.user._id,
      instrument: normalizedInstrument,
      groupId: group._id,
      groupName: group.groupName,
    });

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

    const alreadyInTargetGroup = await Subscription.exists({
      user: subscription.user,
      group: newGroup._id,
      status: { $in: ACTIVE_STATUSES },
    });

    if (!alreadyInTargetGroup) {
      const usersInTargetGroup = await Subscription.distinct("user", {
        group: newGroup._id,
        status: { $in: ACTIVE_STATUSES },
      });

      if (usersInTargetGroup.length >= newGroup.capacity) {
        return res.status(400).json({
          success: false,
          message: `Group "${newGroup.groupName}" is at full capacity (${newGroup.capacity}/${newGroup.capacity})`,
        });
      }
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

    const previousGroupIds = await Subscription.distinct("group", {
      user: subscription.user,
      teacher: teacherId,
      instrument: subscription.instrument,
      status: { $in: ACTIVE_STATUSES },
      group: { $ne: null },
    });

    await syncUserGroupPlacements({
      userIds: [subscription.user],
      teacherId,
      instrument: subscription.instrument,
      groupId: newGroup._id,
      groupName: newGroup.groupName,
    });

    const groupsToRefresh = new Set([
      String(newGroup._id),
      ...previousGroupIds.map((id) => String(id)),
    ]);

    await Promise.all([...groupsToRefresh].map((groupId) => refreshGroupFill(groupId)));

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

export const deleteGroup = async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;

    const groupId = String(req.body?.groupId || req.params?.groupId || "").trim();
    const teacherId = req.user._id;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({
        success: true,
        message: "Group already deleted",
      });
    }

    if (String(group.teacher) !== String(teacherId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own groups",
      });
    }

    const unassignedCount = await Subscription.countDocuments({
      group: group._id,
      status: { $in: ACTIVE_STATUSES },
    });

    await Subscription.updateMany(
      { group: group._id },
      { $set: { group: null, groupName: "" } }
    );
    await ClassSchedule.deleteMany({ group: group._id });
    await ChatMessage.deleteMany({ group: group._id });
    await GroupTask.deleteMany({ groupId: group._id });
    await Group.deleteOne({ _id: group._id });

    return res.json({
      success: true,
      message:
        unassignedCount > 0
          ? `Group "${group.groupName}" deleted. ${unassignedCount} student(s) moved back to unassigned.`
          : `Group "${group.groupName}" deleted successfully`,
      deletedGroupId: groupId,
    });
  } catch (error) {
    console.error("deleteGroup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
