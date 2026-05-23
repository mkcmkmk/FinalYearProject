import Payment from "../models/Payment.js";
import {
  generateSignature,
  verifySignature,
  generateTransactionUUID,
} from "../utils/signature.js";

/**
 * eSewa Payment Service
 * Handles all payment-related business logic
 */

const esewaPAYMENT_CONFIG = {
  SANDBOX_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  PRODUCTION_URL: "https://epay.esewa.com.np/api/epay/main/v2/form",
  PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
  SECRET_KEY: process.env.ESEWA_SECRET_KEY,
  MERCHANT_CODE: process.env.ESEWA_MERCHANT_CODE,
};

/**
 * Verify payment gateway configuration
 */
export const verifyConfiguration = () => {
  if (!esewaPAYMENT_CONFIG.SECRET_KEY) {
    throw new Error("ESEWA_SECRET_KEY not configured in .env");
  }
  if (!esewaPAYMENT_CONFIG.MERCHANT_CODE) {
    throw new Error("ESEWA_MERCHANT_CODE not configured in .env");
  }
};

/**
 * Initiate payment - Create payment record and generate signature
 * @param {Object} paymentData
 * @param {string} paymentData.userId - User ID
 * @param {number} paymentData.amount - Base amount
 * @param {number} paymentData.tax_amount - Tax amount
 * @param {string} paymentData.orderId - Optional order/subscription ID
 * @param {string} paymentData.ip_address - Client IP address
 * @returns {Object} Payment data with signature
 */
export const initiatePayment = async (paymentData) => {
  try {
    verifyConfiguration();

    const {
      userId,
      amount,
      tax_amount = 0,
      orderId = null,
      ip_address,
    } = paymentData;

    // Validate inputs
    if (!userId || amount <= 0) {
      throw new Error("Invalid payment data: userId and positive amount required");
    }

    // Calculate total amount
    const total_amount = amount + tax_amount;

    // Generate unique transaction UUID
    const transaction_uuid = generateTransactionUUID();

    // Create signature payload
    const signaturePayload = {
      total_amount,
      transaction_uuid,
      product_code: esewaPAYMENT_CONFIG.PRODUCT_CODE,
    };

    // Generate signature on backend (NEVER on frontend)
    const signature = generateSignature(
      signaturePayload,
      esewaPAYMENT_CONFIG.SECRET_KEY
    );

    // Create payment record in database
    const payment = new Payment({
      userId,
      orderId,
      transaction_uuid,
      amount,
      tax_amount,
      total_amount,
      product_code: esewaPAYMENT_CONFIG.PRODUCT_CODE,
      status: "PENDING",
      signature,
      ip_address,
    });

    await payment.save();

    console.log(`[eSewa Service] Payment initiated for user ${userId}, UUID: ${transaction_uuid}`);

    // Return payment form data for frontend
    return {
      success: true,
      payment: {
        _id: payment._id,
        transaction_uuid,
        amount,
        tax_amount,
        total_amount,
        product_code: esewaPAYMENT_CONFIG.PRODUCT_CODE,
        signature,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${process.env.BACKEND_URL || "http://localhost:3000"}/api/payment/esewa/success`,
        failure_url: `${process.env.BACKEND_URL || "http://localhost:3000"}/api/payment/esewa/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
      },
      esewa_url: process.env.NODE_ENV === "production"
        ? esewaPAYMENT_CONFIG.PRODUCTION_URL
        : esewaPAYMENT_CONFIG.SANDBOX_URL,
    };
  } catch (error) {
    console.error("[eSewa Service] Payment initiation failed:", error.message);
    throw error;
  }
};

/**
 * Verify payment from eSewa response
 * @param {Object} esewa_response - Response from eSewa
 * @returns {Object} Verification result
 */
export const verifyPayment = async (esewa_response) => {
  try {
    verifyConfiguration();

    const { transaction_uuid, status, total_amount } = esewa_response;

    console.log(`[eSewa Service] Verifying payment with UUID: ${transaction_uuid}`);

    // 1. Find payment record
    const payment = await Payment.findByTransactionId(transaction_uuid);

    if (!payment) {
      throw new Error(
        `Payment record not found for transaction_uuid: ${transaction_uuid}`
      );
    }

    // 2. Check if payment already processed (prevent duplicate)
    if (payment.status === "PAID") {
      console.warn(
        `[eSewa Service] Duplicate payment attempt for UUID: ${transaction_uuid}`
      );
      throw new Error("Payment already processed");
    }

    // 3. Verify signature
    const isSignatureValid = verifySignature(
      esewa_response,
      esewaPAYMENT_CONFIG.SECRET_KEY
    );

    if (!isSignatureValid) {
      await payment.markAsFailed("Signature verification failed");
      throw new Error("Invalid payment signature - possible tampering detected");
    }

    // 4. Check payment status
    if (status !== "COMPLETE") {
      await payment.markAsFailed(`Payment status: ${status}`);
      throw new Error(`Payment not completed. Status: ${status}`);
    }

    // 5. Validate amount matches
    if (payment.total_amount !== total_amount) {
      await payment.markAsFailed(
        `Amount mismatch: expected ${payment.total_amount}, got ${total_amount}`
      );
      throw new Error("Payment amount mismatch");
    }

    // 6. Mark payment as completed
    await payment.markAsCompleted(esewa_response);

    console.log(
      `[eSewa Service] Payment verified successfully for UUID: ${transaction_uuid}`
    );

    return {
      success: true,
      payment,
      message: "Payment verified and processed successfully",
    };
  } catch (error) {
    console.error("[eSewa Service] Payment verification failed:", error.message);
    throw error;
  }
};

/**
 * Handle payment failure
 * @param {string} transaction_uuid - Transaction UUID
 * @param {string} failure_reason - Reason for failure
 */
export const handlePaymentFailure = async (
  transaction_uuid,
  failure_reason = "Payment cancelled by user"
) => {
  try {
    const payment = await Payment.findByTransactionId(transaction_uuid);

    if (payment) {
      await payment.markAsFailed(failure_reason);
      console.log(`[eSewa Service] Payment marked as failed: ${transaction_uuid}`);
    }
  } catch (error) {
    console.error(
      "[eSewa Service] Error handling payment failure:",
      error.message
    );
  }
};

/**
 * Get payment status
 * @param {string} transaction_uuid - Transaction UUID
 * @returns {Object} Payment details
 */
export const getPaymentStatus = async (transaction_uuid) => {
  try {
    const payment = await Payment.findByTransactionId(transaction_uuid);

    if (!payment) {
      throw new Error(`Payment not found: ${transaction_uuid}`);
    }

    return {
      success: true,
      payment: {
        _id: payment._id,
        transaction_uuid: payment.transaction_uuid,
        status: payment.status,
        amount: payment.total_amount,
        esewa_transaction_code: payment.esewa_transaction_code,
        completed_at: payment.completed_at,
        error_message: payment.error_message,
      },
    };
  } catch (error) {
    console.error("[eSewa Service] Error fetching payment status:", error.message);
    throw error;
  }
};

/**
 * Get user's payment history
 * @param {string} userId - User ID
 * @returns {Array} Payment records
 */
export const getUserPaymentHistory = async (userId) => {
  try {
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .select(
        "transaction_uuid amount total_amount status created_at completed_at"
      );

    return {
      success: true,
      payments,
    };
  } catch (error) {
    console.error("[eSewa Service] Error fetching payment history:", error.message);
    throw error;
  }
};

export default {
  verifyConfiguration,
  initiatePayment,
  verifyPayment,
  handlePaymentFailure,
  getPaymentStatus,
  getUserPaymentHistory,
};
