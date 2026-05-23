import * as esewaService from "../services/esewa.service.js";

/**
 * eSewa Payment Controller
 * Handles all payment endpoints
 */

/**
 * POST /api/payment/esewa/initiate
 * Initiate eSewa payment
 * Frontend calls this to get payment form data and redirect URL
 */
export const initiateEsewaPayment = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Extract payment data from request body
    const { amount, tax_amount = 0, orderId } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required",
      });
    }

    // Get client IP address for logging
    const ip_address =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;

    // Call service to create payment
    const paymentData = {
      userId,
      amount: parseFloat(amount),
      tax_amount: parseFloat(tax_amount),
      orderId: orderId || null,
      ip_address,
    };

    const result = await esewaService.initiatePayment(paymentData);

    // Return payment form data for frontend
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Controller] Payment initiation error:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message || "Payment initiation failed",
    });
  }
};

/**
 * GET /api/payment/esewa/success
 * eSewa redirects here after successful payment
 * Verify and process the payment
 */
export const esewaPaymentSuccess = async (req, res) => {
  try {
    console.log("[Controller] eSewa success redirect received");
    console.log("[Controller] Query params:", req.query);

    // Extract eSewa response from query parameters
    const esewa_response = {
      transaction_code: req.query.transaction_code,
      status: req.query.status,
      total_amount: parseFloat(req.query.total_amount),
      transaction_uuid: req.query.transaction_uuid,
      product_code: req.query.product_code,
      signed_field_names: req.query.signed_field_names,
      signature: req.query.signature,
    };

    // Validate required fields
    if (!esewa_response.transaction_uuid || !esewa_response.signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment parameters",
      });
    }

    // Verify payment with service
    const verificationResult = await esewaService.verifyPayment(esewa_response);

    // Payment verified successfully!
    console.log("[Controller] Payment verified successfully");

    // Redirect to frontend success page
    // In production, send JWT token or session to frontend
    const successUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success?transaction_uuid=${esewa_response.transaction_uuid}&status=success`;

    return res.redirect(successUrl);
  } catch (error) {
    console.error("[Controller] Payment verification error:", error.message);

    // Redirect to failure page with error
    const failureUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failure?error=${encodeURIComponent(error.message)}`;

    return res.redirect(failureUrl);
  }
};

/**
 * GET /api/payment/esewa/failure
 * eSewa redirects here if payment fails or is cancelled
 */
export const esewaPaymentFailure = async (req, res) => {
  try {
    const { transaction_uuid, error } = req.query;

    console.log(
      `[Controller] Payment failure for transaction: ${transaction_uuid}, error: ${error}`
    );

    // Mark payment as failed in database
    if (transaction_uuid) {
      await esewaService.handlePaymentFailure(
        transaction_uuid,
        error || "Payment cancelled or failed"
      );
    }

    // Redirect to frontend failure page
    const failureUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failure?transaction_uuid=${transaction_uuid}&error=${encodeURIComponent(error || "Payment failed")}`;

    return res.redirect(failureUrl);
  } catch (error) {
    console.error("[Controller] Payment failure handler error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Error processing payment failure",
    });
  }
};

/**
 * GET /api/payment/esewa/verify/:transaction_uuid
 * Manual verification endpoint - can be called by frontend after redirect
 * Useful for checking payment status without relying on redirect
 */
export const verifyEsewaPayment = async (req, res) => {
  try {
    const { transaction_uuid } = req.params;

    if (!transaction_uuid) {
      return res.status(400).json({
        success: false,
        error: "transaction_uuid is required",
      });
    }

    // Get payment status from database
    const result = await esewaService.getPaymentStatus(transaction_uuid);

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Controller] Verification error:", error.message);

    return res.status(404).json({
      success: false,
      error: error.message || "Payment not found",
    });
  }
};

/**
 * GET /api/payment/history
 * Get current user's payment history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const result = await esewaService.getUserPaymentHistory(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Controller] Error fetching payment history:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch payment history",
    });
  }
};

export default {
  initiateEsewaPayment,
  esewaPaymentSuccess,
  esewaPaymentFailure,
  verifyEsewaPayment,
  getPaymentHistory,
};
