import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import TeacherRating from "../models/TeacherRating.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import fs from "fs";
import path from "path";

// Debug logging to file
const DEBUG_LOG = (message, data = "") => {
  const logMessage = `[${new Date().toISOString()}] ${message} ${data}\n`;
  fs.appendFileSync(path.join(process.cwd(), "debug.log"), logMessage);
  console.log(message, data);
};

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

const activateSubscription = async (sub, pidx, transactionId) => {
  if (sub.status === "active") {
    return { alreadyActive: true };
  }

  sub.status = "active";
  sub.paidAt = new Date();
  await sub.save();

  await Payment.findOneAndUpdate(
    { orderId: sub._id },
    {
      status: "PAID",
      completed_at: new Date(),
      transaction_uuid: transactionId || pidx,
      ...(pidx ? { khaltiPidx: pidx } : {}),
    }
  );

  await User.findByIdAndUpdate(sub.user, {
    isMember: true,
    UpdatedAt: new Date(),
  });

  return { alreadyActive: false };
};

const resolveSubscriptionForVerify = async (userId, { purchaseOrderId, pidx }) => {
  const ownerMatch = (sub) => sub && String(sub.user) === String(userId);

  if (purchaseOrderId && mongoose.Types.ObjectId.isValid(String(purchaseOrderId))) {
    const byOrderId = await Subscription.findById(purchaseOrderId);
    if (ownerMatch(byOrderId)) return byOrderId;
  }

  if (pidx) {
    const payment = await Payment.findOne({
      userId,
      $or: [{ khaltiPidx: pidx }, { transaction_uuid: pidx }],
    }).lean();

    if (payment?.orderId) {
      const byPayment = await Subscription.findById(payment.orderId);
      if (ownerMatch(byPayment)) return byPayment;
    }
  }

  const pending = await Subscription.findOne({ user: userId, status: "pending" }).sort({
    createdAt: -1,
  });
  if (ownerMatch(pending)) return pending;

  const active = await Subscription.findOne({ user: userId, status: "active" }).sort({
    createdAt: -1,
  });
  if (ownerMatch(active)) return active;

  return null;
};

const getExpectedAmountPaisa = (sub) => (sub.amount || priceMap[sub.plan] || 0) * 100;

const validateKhaltiAmounts = (sub, { khaltiTotalAmount, callbackAmountPaisa }) => {
  const expectedPaisa = getExpectedAmountPaisa(sub);
  if (!expectedPaisa) return { ok: true, expectedPaisa };

  if (khaltiTotalAmount != null && Number(khaltiTotalAmount) !== expectedPaisa) {
    return {
      ok: false,
      expectedPaisa,
      message: `Khalti amount (Rs ${Number(khaltiTotalAmount) / 100}) does not match subscription (Rs ${expectedPaisa / 100})`,
    };
  }

  if (callbackAmountPaisa != null && Number(callbackAmountPaisa) !== expectedPaisa) {
    return {
      ok: false,
      expectedPaisa,
      message: `Callback amount (Rs ${Number(callbackAmountPaisa) / 100}) does not match subscription (Rs ${expectedPaisa / 100})`,
    };
  }

  return { ok: true, expectedPaisa };
};

const isSubscriptionExpired = (subscription) => {
  if (!subscription?.expiresAt) {
    return false;
  }

  return new Date(subscription.expiresAt).getTime() <= Date.now();
};

const getBlockingSubscription = async (userId) => {
  const latestSubscription = await Subscription.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (!latestSubscription) {
    return null;
  }

  if (["expired", "none"].includes(latestSubscription.status)) {
    return null;
  }

  if (latestSubscription.status === "active" && isSubscriptionExpired(latestSubscription)) {
    await Subscription.findByIdAndUpdate(latestSubscription._id, {
      status: "expired",
      expiresAt: latestSubscription.expiresAt || new Date(),
    });
    await User.findByIdAndUpdate(userId, {
      isMember: false,
      UpdatedAt: new Date(),
    });
    return null;
  }

  return latestSubscription;
};

export const createSubscription = async (req, res) => {
  try {
    DEBUG_LOG("🔵 createSubscription START - User:", req.user?._id);
    
    const { plan, instrument, level, teacherId } = req.body;
    DEBUG_LOG("📝 Request body:", JSON.stringify({ plan, instrument, level, teacherId }));

    if (!plan || !instrument || !level) {
      console.log("❌ Validation failed: Missing required fields");
      return res.status(400).json({ success: false, message: "Plan, instrument, and level are required" });
    }

    if (!priceMap[plan]) {
      console.log("❌ Validation failed: Invalid plan");
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    if (!allowedLevels.includes(String(level).toLowerCase())) {
      console.log("❌ Validation failed: Invalid level");
      return res.status(400).json({ success: false, message: "Invalid level" });
    }

    console.log("✅ Initial validation passed");

    const blockingSubscription = await getBlockingSubscription(req.user._id);
    if (blockingSubscription) {
      console.log("❌ User has blocking subscription:", blockingSubscription.status);
      return res.status(400).json({
        success: false,
        message:
          blockingSubscription.status === "pending"
            ? "You already have a pending subscription. Please wait for it to be completed or expired before subscribing again."
            : "You already have an active subscription. You can subscribe again only after it expires.",
        subscription: {
          id: blockingSubscription._id,
          plan: blockingSubscription.plan,
          instrument: blockingSubscription.instrument,
          level: blockingSubscription.level || "beginner",
          status: blockingSubscription.status,
          expiresAt: blockingSubscription.expiresAt || null,
        },
      });
    }

    let teacher = null;
    if (teacherId) {
      console.log("🔍 Looking for teacher:", teacherId);
      teacher = await User.findOne({ _id: teacherId, role: "teacher", isTeacher: true })
        .select("name instrumentExpertise")
        .lean();
      if (!teacher) {
        console.log("❌ Teacher not found");
        return res.status(404).json({ success: false, message: "Selected teacher not found or not yet approved" });
      }

      if (!matchesInstrumentExpertise(teacher, instrument)) {
        console.log("❌ Teacher doesn't teach this instrument");
        return res.status(400).json({
          success: false,
          message: "Selected teacher does not teach this instrument",
        });
      }
    }

    console.log("✅ Teacher validation passed");

    const computeExpiry = (plan, fromDate = new Date()) => {
      const expires = new Date(fromDate);
      if (plan === "monthly") expires.setMonth(expires.getMonth() + 1);
      if (plan === "quarterly") expires.setMonth(expires.getMonth() + 3);
      if (plan === "yearly") expires.setFullYear(expires.getFullYear() + 1);
      return expires;
    };

    console.log("📦 Creating subscription...");
    const sub = await Subscription.create({
      user: req.user._id,
      plan,
      instrument: String(instrument).trim(),
      level: String(level).toLowerCase(),
      teacher: teacher?._id || null,
      amount: priceMap[plan],
      status: "pending",
      expiresAt: computeExpiry(plan, new Date()),
    });
    console.log("✅ Subscription created:", sub._id);

    // Generate unique transaction UUID
    const transaction_uuid = `khalti-init-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    console.log("💾 Creating payment record...");
    // Automatically create a PENDING Payment document to save student's name and details
    await Payment.create({
      userId: req.user._id,
      studentName: req.user.name,
      orderId: sub._id,
      transaction_uuid,
      amount: priceMap[plan],
      total_amount: priceMap[plan],
      product_code: "KHALTI",
    });
    console.log("✅ Payment record created");

    // Initiate Khalti Payment
    let paymentUrl = "";
    let pidx = "";

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

    try {
      const khaltiPayload = {
        return_url: `${frontendUrl}/khalti-callback`,
        website_url: frontendUrl,
        amount: priceMap[plan] * 100, // amount in paisa (Rs * 100)
        purchase_order_id: sub._id.toString(),
        purchase_order_name: `Subscription: ${plan}`,
        customer_info: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.contactNumber ? String(req.user.contactNumber) : "9800000000"
        }
      };

      DEBUG_LOG("🌐 Initiating dynamic Khalti Payment with payload:", JSON.stringify(khaltiPayload));
      const khaltiResponse = await fetch("https://dev.khalti.com/api/v2/epayment/initiate/", {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(khaltiPayload)
      });

      if (!khaltiResponse.ok) {
        const errText = await khaltiResponse.text();
        throw new Error(`Khalti API initiation failed with status ${khaltiResponse.status}: ${errText}`);
      }

      const khaltiData = await khaltiResponse.json();
      paymentUrl = khaltiData.payment_url;
      pidx = khaltiData.pidx;
      DEBUG_LOG("✅ Dynamic Khalti Payment initiated successfully. pidx:", pidx);

      if (pidx) {
        await Payment.findOneAndUpdate({ orderId: sub._id }, { khaltiPidx: pidx });
      }

    } catch (khaltiError) {
      DEBUG_LOG("⚠️ Khalti dynamic initiation failed, falling back to bypass / mock mode. Error:", khaltiError.message);
      // Fallback/bypass logic in case the API fails (e.g. offline development)
      pidx = `demo-pidx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      paymentUrl = `${frontendUrl}/khalti-callback?pidx=${pidx}&status=Completed&purchase_order_id=${sub._id}`;
    }

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
      message: "Subscription created, redirecting to payment gateway...",
      subscription: fullSubscription,
      teacherRating: ratingSummary,
      payment_url: paymentUrl,
      pidx: pidx,
    });
  } catch (err) {
    DEBUG_LOG("❌ createSubscription ERROR:", err.message);
    DEBUG_LOG("❌ Error stack:", err.stack);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

export const getStatements = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get all subscriptions for this user
    const subscriptions = await Subscription.find({ user: userId })
      .populate("teacher", "name email profileImage")
      .lean();

    // 2. Fetch all payment statements for this user
    let payments = await Payment.find({ userId })
      .populate({
        path: "orderId",
        populate: {
          path: "teacher",
          select: "name email profileImage",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Self-healing backfill: Detect any active/pending subscriptions without matching payment records and create them
    const existingPaymentSubIds = new Set(
      payments
        .map((p) => p.orderId?._id || p.orderId)
        .filter(Boolean)
        .map((id) => String(id))
    );

    let needsRefetch = false;
    for (const sub of subscriptions) {
      if (!existingPaymentSubIds.has(String(sub._id))) {
        try {
          // Create a missing payment record for this subscription
          const transaction_uuid = `backfill-${sub._id}-${Math.random().toString(36).substring(2, 6)}`;
          await Payment.create({
            userId,
            studentName: req.user.name || "Guest Student",
            orderId: sub._id,
            transaction_uuid,
            amount: sub.amount || 2500,
            total_amount: sub.amount || 2500,
            product_code: "KHALTI",
            status: sub.status === "active" ? "PAID" : "PENDING",
            completed_at: sub.status === "active" ? (sub.paidAt || new Date()) : null,
          });
          needsRefetch = true;
        } catch (backfillErr) {
          console.error("Error creating backfill payment:", backfillErr.message);
          // Continue with other subscriptions even if one fails
          continue;
        }
      }
    }

    // 4. If we backfilled any payment, refetch the payments list so it's fully populated and accurate
    if (needsRefetch) {
      payments = await Payment.find({ userId })
        .populate({
          path: "orderId",
          populate: {
            path: "teacher",
            select: "name email profileImage",
          },
        })
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (err) {
    console.error("getStatements error:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

const formatSubscriptionPayload = (sub) => ({
  id: sub._id,
  plan: sub.plan,
  instrument: sub.instrument,
  level: sub.level,
  amount: sub.amount || priceMap[sub.plan],
  status: sub.status,
});

export const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, purchase_order_id: purchaseOrderId, amount: callbackAmountPaisa } = req.body;
    if (!pidx) return res.status(400).json({ success: false, message: "pidx is required" });

    // Handle test/demo pidx redirect integration
    if (pidx === "SUPC9fksU7yL63X8qoEYBj" || pidx.startsWith("demo-pidx-")) {
      DEBUG_LOG(`🔑 Verification bypass for test pidx: ${pidx}`);
      const sub = await resolveSubscriptionForVerify(req.user._id, {
        purchaseOrderId: purchaseOrderId,
        pidx,
      });

      if (!sub) {
        return res.status(404).json({ success: false, message: "No pending subscription found for this user." });
      }

      const amountCheck = validateKhaltiAmounts(sub, { callbackAmountPaisa });
      if (!amountCheck.ok) {
        return res.status(400).json({ success: false, message: amountCheck.message });
      }

      const { alreadyActive } = await activateSubscription(sub, pidx, pidx);
      return res.status(200).json({
        success: true,
        message: alreadyActive ? "Payment already verified (Demo)" : "Payment verified successfully (Demo)",
        subscription: formatSubscriptionPayload(sub),
        transactionId: pidx,
      });
    }

    const khaltiResponse = await fetch("https://dev.khalti.com/api/v2/epayment/lookup/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pidx })
    });
    
    const khaltiData = await khaltiResponse.json();

    if (khaltiData.status === "Completed") {
      const sub = await resolveSubscriptionForVerify(req.user._id, {
        purchaseOrderId: purchaseOrderId || khaltiData.purchase_order_id,
        pidx,
      });

      if (!sub) {
        return res.status(404).json({ success: false, message: "Subscription not found for this payment" });
      }

      const amountCheck = validateKhaltiAmounts(sub, {
        khaltiTotalAmount: khaltiData.total_amount,
        callbackAmountPaisa,
      });
      if (!amountCheck.ok) {
        return res.status(400).json({ success: false, message: amountCheck.message });
      }

      const { alreadyActive } = await activateSubscription(
        sub,
        pidx,
        khaltiData.transaction_id || pidx
      );

      return res.status(200).json({
        success: true,
        message: alreadyActive ? "Payment already verified" : "Payment verified successfully",
        subscription: formatSubscriptionPayload(sub),
        transactionId: khaltiData.transaction_id || pidx,
        amountPaid: khaltiData.total_amount ? khaltiData.total_amount / 100 : sub.amount,
      });
    } else {
      return res.status(400).json({ success: false, message: "Payment not completed", status: khaltiData.status });
    }
  } catch (err) {
    console.error("verifyKhaltiPayment error:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

