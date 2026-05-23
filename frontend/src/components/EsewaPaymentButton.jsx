import { useState } from "react";
import axios from "axios";
import "./EsewaPaymentButton.css";

/**
 * eSewa Payment Button Component
 * Handles payment initiation and redirect to eSewa gateway
 */

const EsewaPaymentButton = ({ 
  amount, 
  tax_amount = 0, 
  orderId = null,
  buttonText = "Pay with eSewa",
  className = "",
  onPaymentInitiated = null,
  onError = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePaymentClick = async () => {
    try {
      setError(null);
      setLoading(true);

      // Get auth token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in to proceed with payment");
      }

      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      console.log("[Payment Button] Initiating eSewa payment:", {
        amount,
        tax_amount,
        orderId,
      });

      // Call backend to initiate payment
      const response = await axios.post(
        "http://localhost:3000/api/payment/esewa/initiate",
        {
          amount: parseFloat(amount),
          tax_amount: parseFloat(tax_amount),
          orderId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Payment initiation failed");
      }

      console.log("[Payment Button] Payment initiated successfully");
      console.log("[Payment Button] Response:", response.data);

      // Trigger callback if provided
      if (onPaymentInitiated) {
        onPaymentInitiated(response.data.payment);
      }

      // Extract form data and eSewa URL
      const paymentData = response.data.payment;
      const esewaUrl = response.data.esewa_url;

      // Create form data for eSewa
      const formData = {
        amount: paymentData.amount,
        tax_amount: paymentData.tax_amount,
        total_amount: paymentData.total_amount,
        transaction_uuid: paymentData.transaction_uuid,
        product_code: paymentData.product_code,
        product_service_charge: paymentData.product_service_charge,
        product_delivery_charge: paymentData.product_delivery_charge,
        success_url: paymentData.success_url,
        failure_url: paymentData.failure_url,
        signed_field_names: paymentData.signed_field_names,
        signature: paymentData.signature,
      };

      console.log("[Payment Button] Form data prepared:", formData);

      // Create hidden form and submit
      const form = document.createElement("form");
      form.method = "POST";
      form.action = esewaUrl;

      // Add fields to form
      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      // Append to body and submit
      document.body.appendChild(form);
      console.log("[Payment Button] Submitting form to eSewa...");
      form.submit();

      // Remove form after submission
      document.body.removeChild(form);
    } catch (err) {
      console.error("[Payment Button] Error:", err.message);
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`esewa-payment-container ${className}`.trim()}>
      <button
        type="button"
        onClick={handlePaymentClick}
        disabled={loading}
        className="esewa-payment-btn"
      >
        {loading ? (
          <>
            <span className="loading-spinner"></span>
            Processing...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginRight: "8px" }}
            >
              {/* eSewa-like icon (credit card) */}
              <path d="M20 8H4V6h16m0 10H4v-6h16m0 8H4v-2h16z" />
            </svg>
            {buttonText}
          </>
        )}
      </button>

      {error && (
        <div className="esewa-error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default EsewaPaymentButton;
