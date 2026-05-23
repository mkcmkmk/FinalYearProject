import CryptoJS from "crypto-js";

/**
 * Signature Utility for eSewa Payment Gateway
 * Handles HMAC SHA256 signature generation and verification
 */

/**
 * Generate signature for eSewa payment initiation
 * @param {Object} payload - Payment data
 * @param {number} payload.total_amount - Total payment amount
 * @param {string} payload.transaction_uuid - Unique transaction identifier
 * @param {string} payload.product_code - eSewa product code
 * @param {string} secretKey - eSewa secret key from .env
 * @returns {string} Base64 encoded signature
 */
export const generateSignature = (payload, secretKey) => {
  const { total_amount, transaction_uuid, product_code } = payload;

  // Create message string in exact order required by eSewa
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

  // Generate HMAC SHA256 hash
  const hash = CryptoJS.HmacSHA256(message, secretKey);

  // Convert to Base64 string
  const signature = CryptoJS.enc.Base64.stringify(hash);

  console.log("[eSewa Signature] Generated signature for transaction:", transaction_uuid);

  return signature;
};

/**
 * Verify signature from eSewa response
 * @param {Object} response - eSewa response data
 * @param {string} secretKey - eSewa secret key from .env
 * @returns {boolean} Whether signature is valid
 */
export const verifySignature = (response, secretKey) => {
  // Extract the signature from response (will be removed for verification)
  const { signature, signed_field_names, ...data } = response;

  // Fields to verify based on signed_field_names
  const fieldsToVerify = signed_field_names.split(",");

  // Build message string in order of signed_field_names
  const messageArray = fieldsToVerify.map((field) => {
    const value = data[field];
    return `${field}=${value}`;
  });

  const message = messageArray.join(",");

  // Generate expected signature
  const hash = CryptoJS.HmacSHA256(message, secretKey);
  const expectedSignature = CryptoJS.enc.Base64.stringify(hash);

  // Compare signatures
  const isValid = signature === expectedSignature;

  console.log("[eSewa Verify] Signature verification:", isValid ? "PASSED" : "FAILED");
  console.log("[eSewa Verify] Expected:", expectedSignature);
  console.log("[eSewa Verify] Received:", signature);

  return isValid;
};

/**
 * Generate unique transaction UUID
 * Format: timestamp-random
 * @returns {string} Unique transaction UUID
 */
export const generateTransactionUUID = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

export default {
  generateSignature,
  verifySignature,
  generateTransactionUUID,
};
