import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_KEY, { expiresIn: "1h" });
};

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
      isTeacher: role === "teacher",
    });

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

export { login, register };
