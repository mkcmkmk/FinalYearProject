// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// export const protect = async (req, res, next) => {
//   try {
//     const auth = req.headers.authorization;

//     if (!auth || !auth.startsWith("Bearer ")) {
//       return res.status(401).json({ success: false, message: "Not authorized" });
//     }

//     const token = auth.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_KEY);

//     const user = await User.findById(decoded.id).select("-password");
//     if (!user) {
//       return res.status(401).json({ success: false, message: "User not found" });
//     }

//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(401).json({ success: false, message: "Invalid token" });
//   }
// };
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user; // ✅ VERY IMPORTANT
    next();
  } catch (err) {
    console.error("protect middleware error:", err);
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};
