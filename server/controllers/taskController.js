import GroupTask from "../models/GroupTask.js";
import Group from "../models/Group.js";
import Subscription from "../models/Subscription.js";
import StudentTaskProgress from "../models/StudentTaskProgress.js";

const STUDENT_STATUSES = ["todo", "in_progress", "done"];

const getStudentGroupId = async (userId) => {
  const subscription = await Subscription.findOne({
    user: userId,
    status: { $in: ["active", "pending"] },
    group: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .select("group")
    .lean();

  return subscription?.group || null;
};

const formatTaskForStudent = (task, progress) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  dueDate: task.dueDate,
  createdAt: task.createdAt,
  groupName: task.groupId?.groupName || "My Group",
  instrument: task.groupId?.instrument || "",
  studentStatus: progress?.status || "todo",
});

export const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, groupId } = req.body;
    const teacherId = req.user._id;

    if (!title || !description || !dueDate || !groupId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const group = await Group.findOne({ _id: groupId, teacher: teacherId });
    if (!group) {
      return res.status(403).json({ success: false, message: "Unauthorized to assign task to this group" });
    }

    const newTask = new GroupTask({
      title,
      description,
      dueDate,
      groupId,
      teacherId,
    });

    await newTask.save();
    res.status(201).json({ success: true, task: newTask, message: "Task assigned successfully" });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTeacherTasks = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const tasks = await GroupTask.find({ teacherId })
      .populate("groupId", "groupName instrument")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getStudentTasks = async (req, res) => {
  try {
    const groupId = await getStudentGroupId(req.user._id);

    if (!groupId) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    const tasks = await GroupTask.find({ groupId, status: "active" })
      .populate("groupId", "groupName instrument")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const taskIds = tasks.map((task) => task._id);
    const progressRows = await StudentTaskProgress.find({
      task: { $in: taskIds },
      student: req.user._id,
    }).lean();

    const progressByTask = new Map(progressRows.map((row) => [String(row.task), row]));

    const formatted = tasks.map((task) =>
      formatTaskForStudent(task, progressByTask.get(String(task._id)))
    );

    return res.status(200).json({ success: true, tasks: formatted });
  } catch (error) {
    console.error("Error fetching student tasks:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getStudentTaskById = async (req, res) => {
  try {
    const groupId = await getStudentGroupId(req.user._id);

    if (!groupId) {
      return res.status(404).json({ success: false, message: "No group assigned" });
    }

    const task = await GroupTask.findOne({
      _id: req.params.id,
      groupId,
      status: "active",
    })
      .populate("groupId", "groupName instrument")
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const progress = await StudentTaskProgress.findOne({
      task: task._id,
      student: req.user._id,
    }).lean();

    return res.status(200).json({
      success: true,
      task: formatTaskForStudent(task, progress),
    });
  } catch (error) {
    console.error("Error fetching student task:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateStudentTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!STUDENT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be todo, in_progress, or done",
      });
    }

    const groupId = await getStudentGroupId(req.user._id);

    if (!groupId) {
      return res.status(403).json({ success: false, message: "No group assigned" });
    }

    const task = await GroupTask.findOne({
      _id: req.params.id,
      groupId,
      status: "active",
    })
      .populate("groupId", "groupName instrument")
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const progress = await StudentTaskProgress.findOneAndUpdate(
      { task: task._id, student: req.user._id },
      { status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Task status updated",
      task: formatTaskForStudent(task, progress),
    });
  } catch (error) {
    console.error("Error updating student task status:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
