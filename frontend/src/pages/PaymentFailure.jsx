import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./PaymentResult.css";

/**
 * Payment Failure Page Component
 * User is redirected here by eSewa if payment fails or is cancelled
 */

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const transaction_uuid = searchParams.get("transaction_uuid");
  const error = searchParams.get("error");

  return (
    <div className="payment-result-page failure">
      <div className="result-container">
        <div className="result-card">
          <div className="result-icon failure-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>

          <h1>Payment Failed</h1>
          <p className="subtitle">We could not process your payment</p>

          {error && (
            <div className="error-box">
              <strong>Reason:</strong>
              <p>{decodeURIComponent(error)}</p>
            </div>
          )}

          {transaction_uuid && (
            <div className="transaction-info">
              <small>Transaction ID: {transaction_uuid}</small>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={() => navigate("/pay")}
              className="btn btn-primary"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>

          <details className="troubleshooting">
            <summary onClick={() => setShowDetails(!showDetails)}>
              Why did my payment fail?
            </summary>
            {showDetails && (
              <div className="troubleshooting-content">
                <ul>
                  <li>
                    <strong>Insufficient Balance:</strong> Your eSewa account may not have
                    sufficient balance. Please check your wallet.
                  </li>
                  <li>
                    <strong>Connection Error:</strong> A network issue may have occurred.
                    Try again with a stable connection.
                  </li>
                  <li>
                    <strong>Incorrect Details:</strong> Payment details may be incorrect.
                    Verify your eSewa account information.
                  </li>
                  <li>
                    <strong>Session Timeout:</strong> Your eSewa session may have expired.
                    Try again.
                  </li>
                  <li>
                    <strong>Device Issue:</strong> Clear your browser cache and try from
                    a different device or browser.
                  </li>
                </ul>
                <p>
                  If the problem persists, contact our support team for assistance.
                </p>
              </div>
            )}
          </details>

          <div className="info-box warning">
            <p>
              ⚠ No payment has been deducted from your account
              <br />
              ⚠ Please try again or contact support if you need help
              <br />⚠ Your transaction will remain pending until successful payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
