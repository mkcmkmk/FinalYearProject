import express from "express";
import { protect } from "../middleware/auth.js";
import {
  updateMe,
  getMe,
  getMyTeacherProfile,
  getTeacherDirectory,
  getTeacherProfileById,
  submitTeacherRating,
  getAdminNotices,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.get("/notices", protect, getAdminNotices);
router.get("/teacher-profile/me", protect, getMyTeacherProfile);
router.get("/teachers", protect, getTeacherDirectory);
router.get("/teachers/:id", protect, getTeacherProfileById);
router.post("/teachers/:id/rating", protect, submitTeacherRating);

export default router;
