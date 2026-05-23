import mongoose from "mongoose";

/**
 * Payment Schema for eSewa Integration
 * Tracks all payment transactions with eSewa
 */
const paymentSchema = new mongoose.Schema(
  {
    // User who made the payment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Name of the student at the time of payment
    studentName: {
      type: String,
      required: true,
    },

    // Order or subscription reference
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription", // or Order model depending on your use case
      required: false,
    },

    // Unique transaction identifier (generated on backend)
    transaction_uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Format: timestamp-random (e.g., "250610-162413-xyz")
    },

    // eSewa transaction code returned after successful payment
    esewa_transaction_code: {
      type: String,
      default: null,
      index: true,
    },

    // Payment amounts
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    tax_amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Product code (eSewa requires this)
    product_code: {
      type: String,
      default: "EPAYTEST", // Change to production code in .env
      required: true,
    },

    // Payment status: PENDING, PAID, FAILED, CANCELLED
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // Signature sent by eSewa (for verification)
    signature: {
      type: String,
      default: null,
    },

    // Payment method
    payment_method: {
      type: String,
      default: "eSewa",
    },

    // Error message if payment failed
    error_message: {
      type: String,
      default: null,
    },

    // eSewa response data (stored for audit)
    esewa_response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // IP address of user who initiated payment
    ip_address: {
      type: String,
      default: null,
    },

    // Success redirect timestamp
    completed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

// Compound index for user and status queries
paymentSchema.index({ userId: 1, status: 1 });

// Compound index for transaction tracking
paymentSchema.index({ transaction_uuid: 1, status: 1 });

/**
 * Pre-save middleware to validate payment data
 */
paymentSchema.pre("save", async function () {
  // Ensure total_amount matches amount + tax_amount
  if (this.total_amount !== this.amount + this.tax_amount) {
    this.total_amount = this.amount + this.tax_amount;
  }
});

/**
 * Instance method to mark payment as completed
 */
paymentSchema.methods.markAsCompleted = function (esewa_response) {
  this.status = "PAID";
  this.esewa_transaction_code = esewa_response.transaction_code;
  this.signature = esewa_response.signature;
  this.esewa_response = esewa_response;
  this.completed_at = new Date();
  return this.save();
};

/**
 * Instance method to mark payment as failed
 */
paymentSchema.methods.markAsFailed = function (error_message) {
  this.status = "FAILED";
  this.error_message = error_message;
  return this.save();
};

/**
 * Static method to find payment by transaction UUID
 */
paymentSchema.statics.findByTransactionId = function (transaction_uuid) {
  return this.findOne({ transaction_uuid });
};

/**
 * Static method to find pending payments for a user
 */
paymentSchema.statics.findPendingForUser = function (userId) {
  return this.find({ userId, status: "PENDING" }).sort({ createdAt: -1 });
};

export default mongoose.model("Payment", paymentSchema);
