import jwt from "jsonwebtoken";
import User from "../models/User.js";
import fs from "fs";
import path from "path";

const DEBUG_LOG = (message, data = "") => {
  const logMessage = `[${new Date().toISOString()}] ${message} ${data}\n`;
  fs.appendFileSync(path.join(process.cwd(), "debug.log"), logMessage);
  console.log(message, data);
};

export const protect = async (req, res, next) => {
  try {
    DEBUG_LOG("🔐 protect middleware - path:", req.path);
    
    const auth = req.headers.authorization;
    DEBUG_LOG("🔐 Authorization header present:", !!auth);

    if (!auth || !auth.startsWith("Bearer ")) {
      DEBUG_LOG("🔐 No valid Bearer token");
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    DEBUG_LOG("🔐 Token decoded, user ID:", decoded.id);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      DEBUG_LOG("🔐 User not found in DB");
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user; // ✅ VERY IMPORTANT
    DEBUG_LOG("🔐 User set on req, proceeding to next middleware/route");
    next();
  } catch (err) {
    DEBUG_LOG("🔐 protect middleware error:", err.message);
    console.error("protect middleware error:", err);
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'undefined'} is not authorized to access this route`
      });
    }
    next();
  };
};
