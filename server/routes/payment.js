import express from "express";
import { protect } from "../middleware/auth.js";
import { createSubscription } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/subscribe", protect, createSubscription);

export default router;
