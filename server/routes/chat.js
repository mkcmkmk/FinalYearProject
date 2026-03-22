import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getAccessibleRooms,
  getRoomMessages,
  sendRoomMessage,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/rooms", protect, getAccessibleRooms);
router.get("/rooms/:roomId/messages", protect, getRoomMessages);
router.post("/rooms/:roomId/messages", protect, sendRoomMessage);

export default router;
