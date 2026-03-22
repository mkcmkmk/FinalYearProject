import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import axios from "axios"; // ✅ FIX 1
import "./Pay.css";


const Pay = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();

  const plans = [
    { id: "monthly", name: "Monthly", price: 2500 },
    { id: "quarterly", name: "Quarterly", price: 4000 },
    { id: "yearly", name: "Yearly", price: 10000 },
  ];

  const instruments = [
    "Guitar",
    "Piano",
    "Drums",
    "Vocal",
    "Violin",
    "Saxophone",
  ];

  const [selectedPlanId, setSelectedPlanId] = useState("monthly");
  const [selectedInstrument, setSelectedInstrument] = useState("Guitar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prefill plan if navigated from StudentDashboard
  useEffect(() => {
    const incomingPlan = state?.plan?.name;
    if (!incomingPlan) return;

    const found = plans.find(
      (p) => p.name.toLowerCase() === incomingPlan.toLowerCase()
    );
    if (found) setSelectedPlanId(found.id);
  }, [state]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // ✅ FIX 2: async function
const handlePay = async (e) => {
  e.preventDefault();
  setError(null);

  const token = localStorage.getItem("token");
  if (!token) {
    setError("You must be logged in to continue");
    return;
  }

  setLoading(true);

  try {
    await axios.post(
      "http://localhost:3000/api/payment/subscribe",
      { plan: selectedPlanId, instrument: selectedInstrument },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Subscription created successfully!");
    navigate("/profile"); // better UX: go profile to see status/instrument
  } catch (err) {
    console.error(err);
    setError(err?.response?.data?.message || "Payment failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="pay-page">
      <div className="pay-card">
        <h1 className="pay-title">Payment</h1>

        <p className="pay-user">
          Student: <b>{user?.name || "Guest"}</b>
        </p>

        {error && <p style={{ color: "red", marginBottom: 10 }}>{error}</p>}

        <form onSubmit={handlePay} className="pay-form">
          {/* Plan */}
          <div className="pay-field">
            <label>Choose Subscription Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} – Rs {p.price}
                </option>
              ))}
            </select>
          </div>

          {/* Instrument */}
          <div className="pay-field">
            <label>Choose Instrument</label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
            >
              {instruments.map((ins) => (
                <option key={ins} value={ins}>
                  {ins}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div className="pay-summary">
            <p>
              <span>Selected Plan:</span>
              <b>
                {selectedPlan.name} (Rs {selectedPlan.price})
              </b>
            </p>
            <p>
              <span>Instrument:</span>
              <b>{selectedInstrument}</b>
            </p>
          </div>

          <button type="submit" className="pay-btn" disabled={loading}>
            {loading ? "Processing..." : "Pay Now"}
          </button>

          <button
            type="button"
            className="pay-back"
            onClick={() => navigate("/student-dashboard")}
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
};

export default Pay;
