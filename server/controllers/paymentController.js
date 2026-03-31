import Subscription from "../models/Subscription.js";
import TeacherRating from "../models/TeacherRating.js";
import User from "../models/User.js";

const priceMap = {
  monthly: 2500,
  quarterly: 4000,
  yearly: 10000,
};

const allowedLevels = ["beginner", "intermediate", "advanced"];

const normalizeInstrument = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getTeacherExpertiseList = (teacher) =>
  String(teacher?.instrumentExpertise || "")
    .split(/[,/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeInstrument);

const matchesInstrumentExpertise = (teacher, instrument) =>
  getTeacherExpertiseList(teacher).includes(normalizeInstrument(instrument));

export const createSubscription = async (req, res) => {
  try {
    const { plan, instrument, level, teacherId } = req.body;

    if (!plan || !instrument || !level) {
      return res.status(400).json({ success: false, message: "Plan, instrument, and level are required" });
    }

    if (!priceMap[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    if (!allowedLevels.includes(String(level).toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid level" });
    }

    let teacher = null;
    if (teacherId) {
      teacher = await User.findOne({ _id: teacherId, role: "teacher" }).select("name instrumentExpertise").lean();
      if (!teacher) {
        return res.status(404).json({ success: false, message: "Selected teacher not found" });
      }

      if (!matchesInstrumentExpertise(teacher, instrument)) {
        return res.status(400).json({
          success: false,
          message: "Selected teacher does not teach this instrument",
        });
      }
    }

    const sub = await Subscription.create({
      user: req.user._id,
      plan,
      instrument: String(instrument).trim(),
      level: String(level).toLowerCase(),
      teacher: teacher?._id || null,
      amount: priceMap[plan],
      status: "pending",
    });

    const fullSubscription = await Subscription.findById(sub._id)
      .populate("teacher", "name email role profileImage instrumentExpertise")
      .lean();

    let ratingSummary = null;
    if (teacher?._id) {
      const ratingStats = await TeacherRating.aggregate([
        { $match: { teacher: teacher._id } },
        {
          $group: {
            _id: "$teacher",
            averageRating: { $avg: "$score" },
            totalRatings: { $sum: 1 },
          },
        },
      ]);

      const summary = ratingStats[0] || null;
      ratingSummary = {
        averageRating: summary?.averageRating ? Number(summary.averageRating.toFixed(1)) : 0,
        totalRatings: summary?.totalRatings || 0,
      };
    }

    return res.status(201).json({
      success: true,
      message: "Subscription created (pending)",
      subscription: fullSubscription,
      teacherRating: ratingSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
