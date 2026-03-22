import express from "express";
import { protect } from "../middleware/auth.js";
import {
  assignStudentsToGroup,
  createClassSchedule,
  getTeacherDashboard,
} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/dashboard", protect, getTeacherDashboard);
router.post("/groups/assign", protect, assignStudentsToGroup);
router.post("/schedules", protect, createClassSchedule);

export default router;
