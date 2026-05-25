import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentResult.css";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const payment = state?.payment;

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
          <p className="subtitle">Your subscription is now active. Thank you.</p>

          {payment && (
            <div className="payment-details">
              {payment.subscription?.plan && (
                <div className="detail-row">
                  <span className="label">Plan:</span>
                  <span className="value">{payment.subscription.plan}</span>
                </div>
              )}
              {payment.subscription?.instrument && (
                <div className="detail-row">
                  <span className="label">Instrument:</span>
                  <span className="value">{payment.subscription.instrument}</span>
                </div>
              )}
              {payment.amount != null && (
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">Rs. {payment.amount}</span>
                </div>
              )}
              {payment.transactionId && (
                <div className="detail-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{payment.transactionId}</span>
                </div>
              )}
            </div>
          )}

          <div className="action-buttons">
            <button
              type="button"
              onClick={() =>
                navigate("/student-dashboard", { state: { paymentSuccess: true, payment } })
              }
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/payment/history")}
              className="btn btn-secondary"
            >
              View Payment History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
