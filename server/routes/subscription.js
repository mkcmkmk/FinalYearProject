import express from "express";
import {
  getMySchedule,
  getMySubscription,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/me", protect, getMySubscription);
router.get("/me/schedule", protect, getMySchedule);

export default router;
