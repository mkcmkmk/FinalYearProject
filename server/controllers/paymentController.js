import Subscription from "../models/Subscription.js";

const priceMap = {
  monthly: 2500,
  quarterly: 4000,
  yearly: 10000,
};

export const createSubscription = async (req, res) => {
  try {
    const { plan, instrument } = req.body;

    if (!plan || !instrument) {
      return res.status(400).json({ success: false, message: "Plan and instrument required" });
    }

    if (!priceMap[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    // Create a "pending" record first (real payment gateway will confirm later)
    const sub = await Subscription.create({
      user: req.user._id,
      plan,
      instrument,
      amount: priceMap[plan],
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Subscription created (pending)",
      subscription: sub,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
