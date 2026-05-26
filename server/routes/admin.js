import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createAdminNotice,
  getAdminDashboard,
  getAdminSubscriptions,
  getAllUsers,
  removeAdminNotice,
  removeUserAccount,
  reviewTeacherVerification,
  updateSubscriptionStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", protect, getAdminDashboard);
router.get("/users", protect, getAllUsers);
router.get("/subscriptions", protect, getAdminSubscriptions);
router.patch("/teacher-verifications/:id", protect, reviewTeacherVerification);
router.patch("/subscriptions/:id", protect, updateSubscriptionStatus);
router.delete("/users/:id", protect, removeUserAccount);
router.post("/notices", protect, createAdminNotice);
router.delete("/notices/:id", protect, removeAdminNotice);

export default router;
