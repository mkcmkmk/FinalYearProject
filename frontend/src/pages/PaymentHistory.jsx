import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import "./PaymentHistory.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/api/payment/statements`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPayments(response.data.payments || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch payments");
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load payment history");
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

  const calculateTotal = () =>
    filteredPayments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <StudentLayout>
      <div className="payment-history">
        <div className="history-container">
          <div className="history-header flex justify-between items-start gap-4">
            <div>
              <h1>Payment History</h1>
              <p>Track all your payments and transactions</p>
            </div>
            <button
              type="button"
              className="px-5 py-3 border-2 border-gray-100 rounded-[1.25rem] font-bold text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => navigate("/pay")}
            >
              New Payment
            </button>
          </div>

          <div className="filter-section">
            {["ALL", "PAID", "PENDING", "FAILED"].map((status) => (
              <button
                key={status}
                type="button"
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

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

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading payment history...</p>
            </div>
          )}

          {error && !loading && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button type="button" onClick={fetchPaymentHistory} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredPayments.length === 0 && (
            <div className="empty-state">
              <p>No payments found</p>
              <small>Your payment transactions will appear here after you subscribe</small>
            </div>
          )}

          {!loading && !error && filteredPayments.length > 0 && (
            <div className="table-wrapper">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Amount (Rs.)</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className={`status-${String(payment.status).toLowerCase()}`}>
                      <td className="transaction-id">
                        <code>{String(payment.transaction_uuid || "").substring(0, 16)}...</code>
                      </td>
                      <td className="amount">Rs. {payment.amount}</td>
                      <td className="status">
                        <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="date">
                        {new Date(payment.completed_at || payment.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td>{payment.orderId?.plan || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default PaymentHistory;
