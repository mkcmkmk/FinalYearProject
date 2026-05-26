import express from "express";
import {
  createTask,
  getStudentTaskById,
  getStudentTasks,
  getTeacherTasks,
  updateStudentTaskStatus,
} from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/student", protect, authorize("student", "admin"), getStudentTasks);
router.get("/student/:id", protect, authorize("student", "admin"), getStudentTaskById);
router.patch("/:id/status", protect, authorize("student", "admin"), updateStudentTaskStatus);
router.post("/", protect, authorize("teacher", "admin"), createTask);
router.get("/teacher", protect, authorize("teacher", "admin"), getTeacherTasks);

export default router;
