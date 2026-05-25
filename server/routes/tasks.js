import express from "express";
import { createTask, getStudentTasks, getTeacherTasks } from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("teacher", "admin"), createTask);
router.get("/teacher", protect, authorize("teacher", "admin"), getTeacherTasks);
router.get("/student", protect, authorize("student", "admin"), getStudentTasks);

export default router;
