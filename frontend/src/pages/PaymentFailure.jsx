import { useSearchParams, useNavigate } from "react-router-dom";
import "./PaymentResult.css";

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const pidx = searchParams.get("pidx");
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
          <p className="subtitle">We could not complete your subscription payment</p>

          {error && (
            <div className="error-box">
              <strong>Reason:</strong>
              <p>{decodeURIComponent(error)}</p>
            </div>
          )}

          {pidx && (
            <div className="transaction-info">
              <small>Payment reference: {pidx}</small>
            </div>
          )}

          <div className="action-buttons">
            <button type="button" onClick={() => navigate("/pay")} className="btn btn-primary">
              Try Again
            </button>
            <button
              type="button"
              onClick={() => navigate("/student-dashboard")}
              className="btn btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="info-box warning">
            <p>
              No membership was activated.
              <br />
              You can retry payment from the Pay page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
