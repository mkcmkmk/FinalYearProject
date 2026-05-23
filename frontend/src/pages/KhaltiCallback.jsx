import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const KhaltiCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying payment...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    const txnId = searchParams.get("transaction_id");
    const amount = searchParams.get("amount");
    const message = searchParams.get("message");
    const purchase_order_id = searchParams.get("purchase_order_id");

    if (!pidx) {
      setError("Invalid callback URL. Missing pidx.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${API_BASE}/api/payment/khalti-verify`,
          { pidx },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          // Redirect to home page with success state
          navigate("/", { state: { paymentSuccess: true }, replace: true });
        } else {
          setError(res.data.message || "Payment verification failed.");
        }
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "An error occurred during verification.");
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

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
          onClick={() => navigate("/")}
          className="w-full px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-[1.25rem] transition-colors"
        >
          Return to Home Page
        </button>
      </div>
    </div>
  );
};

export default KhaltiCallback;
