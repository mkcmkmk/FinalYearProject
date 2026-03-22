import express from "express";
import { protect } from "../middleware/auth.js";
import {
  updateMe,
  getMe,
  getMyTeacherProfile,
  getTeacherProfileById,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.get("/teacher-profile/me", protect, getMyTeacherProfile);
router.get("/teachers/:id", protect, getTeacherProfileById);

export default router;
