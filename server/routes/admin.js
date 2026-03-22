import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getAdminDashboard,
  reviewTeacherVerification,
  updateSubscriptionStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", protect, getAdminDashboard);
router.patch("/teacher-verifications/:id", protect, reviewTeacherVerification);
router.patch("/subscriptions/:id", protect, updateSubscriptionStatus);

export default router;
