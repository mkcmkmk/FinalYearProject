import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import "./PaymentHistory.css";

/**
 * Payment History Component
 * Display all payments made by the user
 */

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL, PAID, FAILED, PENDING

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await axios.get("http://localhost:3000/api/payment/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setPayments(response.data.payments || []);
      } else {
        throw new Error(response.data.error || "Failed to fetch payments");
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setError(err.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === "ALL") return true;
    return payment.status === filter;
  });

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      PAID: "badge-success",
      FAILED: "badge-danger",
      PENDING: "badge-warning",
      CANCELLED: "badge-secondary",
    };
    return statusMap[status] || "badge-secondary";
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      PAID: "✓",
      FAILED: "✕",
      PENDING: "⏳",
      CANCELLED: "⊘",
    };
    return iconMap[status] || "•";
  };

  const calculateTotal = () => {
    return filteredPayments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
  };

  if (!user) {
    return (
      <div className="payment-history">
        <p>Please log in to view payment history</p>
      </div>
    );
  }

  return (
    <div className="payment-history">
      <div className="history-container">
        <div className="history-header">
          <h1>Payment History</h1>
          <p>Track all your payments and transactions</p>
        </div>

        {/* Filter Buttons */}
        <div className="filter-section">
          {["ALL", "PAID", "PENDING", "FAILED"].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? "active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Stats */}
        {filteredPayments.length > 0 && (
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-label">Total Paid</div>
              <div className="stat-value">Rs. {calculateTotal().toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{filteredPayments.length}</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading payment history...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchPaymentHistory} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPayments.length === 0 && (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            <p>No payments found</p>
            <small>Your payment transactions will appear here</small>
          </div>
        )}

        {/* Payments Table */}
        {!loading && !error && filteredPayments.length > 0 && (
          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount (Rs.)</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>eSewa Ref</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className={`status-${payment.status.toLowerCase()}`}>
                    <td className="transaction-id">
                      <code>{payment.transaction_uuid.substring(0, 12)}...</code>
                    </td>
                    <td className="amount">Rs. {payment.amount}</td>
                    <td className="status">
                      <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                        {getStatusIcon(payment.status)} {payment.status}
                      </span>
                    </td>
                    <td className="date">
                      {new Date(payment.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="esewa-ref">
                      {payment.esewa_transaction_code ? (
                        <code>{payment.esewa_transaction_code}</code>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="action">
                      <button
                        className="action-btn"
                        title="View details"
                        onClick={() => {
                          console.log("View payment details:", payment);
                        }}
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="legend">
          <h4>Status Legend</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="badge badge-success">✓ PAID</span>
              <span>Payment successfully completed</span>
            </div>
            <div className="legend-item">
              <span className="badge badge-warning">⏳ PENDING</span>
              <span>Awaiting payment confirmation</span>
            </div>
            <div className="legend-item">
              <span className="badge badge-danger">✕ FAILED</span>
              <span>Payment failed or cancelled</span>
            </div>
            <div className="legend-item">
              <span className="badge badge-secondary">⊘ CANCELLED</span>
              <span>Payment was cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
