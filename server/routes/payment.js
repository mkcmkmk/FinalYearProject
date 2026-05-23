import express from "express";
import { protect } from "../middleware/auth.js";
import { createSubscription, getStatements, verifyKhaltiPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/subscribe", protect, createSubscription);
router.post("/khalti-verify", protect, verifyKhaltiPayment);
router.get("/statements", protect, getStatements);

export default router;
