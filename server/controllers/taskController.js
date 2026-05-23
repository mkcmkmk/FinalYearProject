import GroupTask from "../models/GroupTask.js";
import Group from "../models/Group.js";

export const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, groupId } = req.body;
    const teacherId = req.user._id;

    if (!title || !description || !dueDate || !groupId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Verify the group belongs to the teacher
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
