import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./PaymentResult.css";

/**
 * Payment Success Page Component
 * User is redirected here by eSewa after successful payment
 */

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const transaction_uuid = searchParams.get("transaction_uuid");
  const status = searchParams.get("status");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!transaction_uuid) {
          throw new Error("Transaction ID not found");
        }

        const token = localStorage.getItem("token");

        // Verify payment status with backend
        const response = await axios.get(
          `http://localhost:3000/api/payment/esewa/verify/${transaction_uuid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setPaymentDetails(response.data.payment);
          console.log("Payment verified:", response.data);
        } else {
          throw new Error(response.data.error || "Payment verification failed");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError(err.message || "Failed to verify payment");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [transaction_uuid]);

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="result-container">
          <div className="result-card loading">
            <div className="spinner"></div>
            <p>Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page success">
      <div className="result-container">
        <div className="result-card">
          <div className="result-icon success-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>

          <h1>Payment Successful!</h1>
          <p className="subtitle">Your payment has been processed successfully</p>

          {error && (
            <div className="warning-box">
              <p>{error}</p>
            </div>
          )}

          {paymentDetails && (
            <div className="payment-details">
              <div className="detail-row">
                <span className="label">Transaction UUID:</span>
                <span className="value">{paymentDetails.transaction_uuid}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">Rs. {paymentDetails.amount}</span>
              </div>
              <div className="detail-row">
                <span className="label">eSewa Reference:</span>
                <span className="value">
                  {paymentDetails.esewa_transaction_code || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="value status-badge paid">
                  {paymentDetails.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">
                  {paymentDetails.completed_at
                    ? new Date(paymentDetails.completed_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate("/payment/history")}
              className="btn btn-secondary"
            >
              View Payment History
            </button>
          </div>

          <div className="info-box">
            <p>
              ✓ Your payment has been received and verified
              <br />
              ✓ A confirmation email has been sent to your registered email
              <br />✓ You can view your transaction history anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
