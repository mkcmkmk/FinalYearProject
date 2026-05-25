import ChatMessage from "../models/ChatMessage.js";
import Group from "../models/Group.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

const MAX_MESSAGES = 200;

const buildRoomId = (roomType, groupId = null) =>
  roomType === "teachers" ? "teachers" : `group:${groupId}`;

const parseRoomId = (roomId) => {
  if (roomId === "teachers") {
    return { roomType: "teachers", groupId: null };
  }

  if (String(roomId).startsWith("group:")) {
    return { roomType: "group", groupId: String(roomId).split(":")[1] };
  }

  return null;
};

const getStudentActiveSubscription = async (userId) =>
  Subscription.findOne({
    user: userId,
    status: "active",
  })
    .sort({ createdAt: -1 })
    .populate("group", "groupName instrument teacher capacity filled")
    .populate("teacher", "name email")
    .lean();

const getTeacherGroups = async (teacherId) =>
  Group.find({ teacher: teacherId }).sort({ groupName: 1 }).lean();

const getGroupParticipants = async (groupId, teacherId) => {
  const subscriptions = await Subscription.find({ group: groupId })
    .populate("user", "name role profileImage")
    .lean();

  const participants = subscriptions
    .map((subscription) => subscription.user)
    .filter(Boolean)
    .map((user) => ({
      id: user._id,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage || "",
    }));

  if (teacherId) {
    const teacher = await User.findById(teacherId).select("name role profileImage").lean();
    if (teacher) {
      participants.unshift({
        id: teacher._id,
        name: teacher.name,
        role: teacher.role,
        profileImage: teacher.profileImage || "",
      });
    }
  }

  const seen = new Set();
  return participants.filter((participant) => {
    const key = String(participant.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getAccessibleRoomsForUser = async (user) => {
  if (user.role === "teacher") {
    const [groups, teachers] = await Promise.all([
      getTeacherGroups(user._id),
      User.find({ role: "teacher" }).select("name role profileImage").lean(),
    ]);

    const teacherRoom = {
      id: buildRoomId("teachers"),
      roomType: "teachers",
      title: "Teacher Lounge",
      subtitle: `${teachers.length} teachers`,
      participants: teachers.map((teacher) => ({
        id: teacher._id,
        name: teacher.name,
        role: teacher.role,
        profileImage: teacher.profileImage || "",
      })),
    };

    const groupRooms = await Promise.all(
      groups.map(async (group) => ({
        id: buildRoomId("group", group._id),
        roomType: "group",
        groupId: group._id,
        title: group.groupName,
        subtitle: group.instrument,
        participants: await getGroupParticipants(group._id, group.teacher),
      }))
    );

    return [teacherRoom, ...groupRooms];
  }

  if (user.role === "student") {
    const subscription = await getStudentActiveSubscription(user._id);
    const group = subscription?.group;

    if (!group?._id) {
      return [];
    }

    return [
      {
        id: buildRoomId("group", group._id),
        roomType: "group",
        groupId: group._id,
        title: group.groupName || subscription.groupName || "My Group",
        subtitle: group.instrument || subscription.instrument || "Group chat",
        participants: await getGroupParticipants(group._id, subscription.teacher?._id || subscription.teacher),
      },
    ];
  }

  return [];
};

const ensureRoomAccess = async (user, roomType, groupId) => {
  if (roomType === "teachers") {
    return user.role === "teacher";
  }

  if (roomType !== "group" || !groupId) {
    return false;
  }

  if (user.role === "teacher") {
    const group = await Group.findOne({ _id: groupId, teacher: user._id }).select("_id").lean();
    return Boolean(group);
  }

  if (user.role === "student") {
    const subscription = await Subscription.findOne({ user: user._id, group: groupId })
      .select("_id status")
      .lean();
    return Boolean(subscription && subscription.status === "active");
  }

  return false;
};

export const getAccessibleRooms = async (req, res) => {
  try {
    const rooms = await getAccessibleRoomsForUser(req.user);
    return res.json({ success: true, rooms });
  } catch (error) {
    console.error("getAccessibleRooms error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const parsed = parseRoomId(req.params.roomId);
    if (!parsed) {
      return res.status(400).json({ success: false, message: "Invalid room" });
    }

    const hasAccess = await ensureRoomAccess(req.user, parsed.roomType, parsed.groupId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = parsed.roomType === "teachers"
      ? { roomType: "teachers", group: null }
      : { roomType: "group", group: parsed.groupId };

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(MAX_MESSAGES)
      .populate("sender", "name role profileImage")
      .lean();

    return res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error("getRoomMessages error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendRoomMessage = async (req, res) => {
  try {
    const parsed = parseRoomId(req.params.roomId);
    if (!parsed) {
      return res.status(400).json({ success: false, message: "Invalid room" });
    }

    const hasAccess = await ensureRoomAccess(req.user, parsed.roomType, parsed.groupId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const body = String(req.body?.body || "").trim();
    if (!body) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const created = await ChatMessage.create({
      roomType: parsed.roomType,
      group: parsed.roomType === "group" ? parsed.groupId : null,
      sender: req.user._id,
      body,
    });

    const message = await ChatMessage.findById(created._id)
      .populate("sender", "name role profileImage")
      .lean();

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("sendRoomMessage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
