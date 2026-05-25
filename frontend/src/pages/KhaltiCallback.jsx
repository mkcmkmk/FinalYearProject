import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/authContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CANCELED_STATUSES = ["user canceled", "canceled", "cancelled", "expired"];

const KhaltiCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("Verifying payment...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    const purchaseOrderId = searchParams.get("purchase_order_id");
    const amount = searchParams.get("amount");
    const khaltiStatus = String(searchParams.get("status") || "").trim();
    const transactionId = searchParams.get("transaction_id");
    const message = searchParams.get("message");

    if (!pidx) {
      setError("Invalid callback URL. Missing pidx.");
      return;
    }

    if (khaltiStatus && CANCELED_STATUSES.includes(khaltiStatus.toLowerCase())) {
      const reason = message || khaltiStatus;
      navigate(
        `/payment/failure?pidx=${encodeURIComponent(pidx)}&error=${encodeURIComponent(reason)}`,
        { replace: true }
      );
      return;
    }

    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in again to complete payment verification.");
          return;
        }

        if (amount) {
          setStatus(`Verifying payment of Rs ${Number(amount) / 100}...`);
        }

        const res = await axios.post(
          `${API_BASE}/api/payment/khalti-verify`,
          {
            pidx,
            ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
            ...(amount ? { amount: Number(amount) } : {}),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          await refreshUser();

          navigate("/student-dashboard", {
            replace: true,
            state: {
              paymentSuccess: true,
              payment: {
                pidx,
                purchaseOrderId,
                amount: res.data.amountPaid ?? (amount ? Number(amount) / 100 : null),
                transactionId: res.data.transactionId || transactionId,
                subscription: res.data.subscription,
              },
            },
          });
        } else {
          const failMessage = res.data.message || "Payment verification failed.";
          navigate(
            `/payment/failure?pidx=${encodeURIComponent(pidx)}&error=${encodeURIComponent(failMessage)}`,
            { replace: true }
          );
        }
      } catch (err) {
        console.error(err);
        const failMessage =
          err?.response?.data?.message || "An error occurred during verification.";
        navigate(
          `/payment/failure?pidx=${encodeURIComponent(pidx)}&error=${encodeURIComponent(failMessage)}`,
          { replace: true }
        );
      }
    };

    verifyPayment();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#e8ecf3] font-sans">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm max-w-md w-full text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Payment Status</h2>

        {error ? (
          <div className="text-red-500 font-bold mb-6">
            <span className="text-4xl block mb-2">❌</span>
            {error}
          </div>
        ) : (
          <div className="text-gray-600 font-bold mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            {status}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/student-dashboard")}
          className="w-full px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-[1.25rem] transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default KhaltiCallback;
