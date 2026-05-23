import express from "express";
import { googleLogin, login, register } from "../controllers/authController.js";

const router = express.Router(); 

router.post("/login", login);
router.post("/google", googleLogin);
router.post("/register", register);

export default router;
