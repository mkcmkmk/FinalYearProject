import express from "express";
import { getMySubscription } from "../controllers/subscriptionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/me", protect, getMySubscription);

export default router;
