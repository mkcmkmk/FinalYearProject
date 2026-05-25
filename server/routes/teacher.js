import express from "express";
import { protect } from "../middleware/auth.js";
import {
  assignStudentsToGroup,
  createClassSchedule,
  deleteGroup,
  getTeacherDashboard,
  reassignStudentToGroup,
} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/dashboard", protect, getTeacherDashboard);
router.post("/groups/assign", protect, assignStudentsToGroup);
router.post("/groups/reassign", protect, reassignStudentToGroup);
router.post("/groups/delete", protect, deleteGroup);
router.post("/groups/:groupId/delete", protect, deleteGroup);
router.delete("/groups/:groupId", protect, deleteGroup);
router.post("/schedules", protect, createClassSchedule);

export default router;
