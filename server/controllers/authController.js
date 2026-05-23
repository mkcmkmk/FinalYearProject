import User from "../models/User.js";
import TeacherVerification from "../models/TeacherVerification.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { sendAdminNotification } from "../utils/emailUtils.js";

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_KEY, { expiresIn: "1h" });
};

const googleClient = new OAuth2Client();

const getGoogleClientIds = () =>
  String(process.env.GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  role: user.role,
  email: user.email,
  profileImage: user.profileImage || "",
  contactNumber: user.contactNumber ?? null,
  instrumentExpertise: user.instrumentExpertise || "",
  yearsOfExperience: user.yearsOfExperience ?? null,
  teacherBio: user.teacherBio || "",
});

const register = async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      role,
      profileImage,
      contactNumber,
      instrumentExpertise,
      yearsOfExperience,
      teacherBio,
    } = req.body;

    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    password = password || "";
    instrumentExpertise = (instrumentExpertise || "").trim();
    teacherBio = (teacherBio || "").trim();

    // Automatically set default password for teacher applications
    if ((role || "student").toLowerCase() === "teacher" && !password) {
      password = "Test@123";
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const allowedRoles = ["student", "teacher"];
    role = (role || "student").toLowerCase();

    if (!allowedRoles.includes(role)) {
      role = "student";
    }

    if (role === "teacher") {
      if (!instrumentExpertise) {
        return res.status(400).json({
          success: false,
          message: "Instrument expertise is required for teacher signup",
        });
      }

      if (yearsOfExperience === undefined || yearsOfExperience === null || yearsOfExperience === "") {
        return res.status(400).json({
          success: false,
          message: "Years of experience is required for teacher signup",
        });
      }

      if (!teacherBio) {
        return res.status(400).json({
          success: false,
          message: "Teacher bio is required for teacher signup",
        });
      }
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      profileImage: profileImage || "",
      contactNumber: contactNumber ? Number(contactNumber) : null,
      instrumentExpertise: role === "teacher" ? instrumentExpertise : "",
      yearsOfExperience: role === "teacher" ? Number(yearsOfExperience) : null,
      teacherBio: role === "teacher" ? teacherBio : "",
      isTeacher: false, // Always start as false, needs admin approval
    });

    if (role === "teacher") {
      // Create verification request
      await TeacherVerification.create({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: contactNumber || "N/A",
        bio: teacherBio,
        category: instrumentExpertise.toLowerCase().includes("guitar") ? "guitar" : 
                  instrumentExpertise.toLowerCase().includes("vocal") ? "vocal" :
                  instrumentExpertise.toLowerCase().includes("piano") ? "piano" :
                  instrumentExpertise.toLowerCase().includes("drums") ? "drums" :
                  instrumentExpertise.toLowerCase().includes("violin") ? "violin" : "other",
        pricePerSession: 0, // Placeholder
        document: { url: "placeholder-url" }, // Placeholder since not in signup form
        status: "pending",
      });

      // Notify Admin
      await sendAdminNotification({
        name: user.name,
        email: user.email,
        instrumentExpertise,
        yearsOfExperience,
      });
    }

    if (role === "teacher") {
      return res.status(201).json({
        success: true,
        message: "Teacher account created. Please wait for admin approval. You will be notified by email.",
      });
    }

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: userResponse(user),
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = (email || "").trim().toLowerCase();
    password = password || "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    // Check if teacher is approved
    if (user.role === "teacher" && !user.isTeacher) {
      return res.status(403).json({
        success: false,
        message: "Your account is waiting for admin approval. You will receive an email once approved.",
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: userResponse(user),
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const credential = String(req.body?.credential || "").trim();
    const googleClientIds = getGoogleClientIds();

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    if (!googleClientIds.length) {
      return res.status(500).json({
        success: false,
        message: "Google Sign-In is not configured on the server",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientIds,
    });

    const payload = ticket.getPayload();
    const email = String(payload?.email || "")
      .trim()
      .toLowerCase();

    if (!payload?.sub || !email) {
      return res.status(400).json({
        success: false,
        message: "Google account information is incomplete",
      });
    }

    if (!payload.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Please use a Google account with a verified email address",
      });
    }

    const googleName = String(payload.name || email.split("@")[0] || "Google User").trim();
    const googlePicture = String(payload.picture || "").trim();
    const googleId = String(payload.sub).trim();

    let user = await User.findOne({ email });

    if (user) {
      const updates = {
        googleId,
        UpdatedAt: new Date(),
      };

      if (!user.profileImage && googlePicture) {
        updates.profileImage = googlePicture;
      }

      if (!user.name && googleName) {
        updates.name = googleName;
      }

      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    } else {
      const password = await bcrypt.hash(
        `${googleId}:${crypto.randomUUID()}:${process.env.JWT_KEY || "harmoniq-google"}`,
        10
      );

      user = await User.create({
        name: googleName,
        email,
        googleId,
        password,
        role: "student",
        profileImage: googlePicture,
        isTeacher: false,
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: userResponse(user),
      message: "Google login successful",
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({
      success: false,
      message: "Google sign-in failed. Please try again.",
    });
  }
};

export { googleLogin, login, register };
