import { useState } from "react";
import { useAuth } from "../context/authContext";
import EsewaPaymentButton from "../components/EsewaPaymentButton";
import "./PaymentPage.css";

/**
 * Payment Page Component
 * Example page showing how to use the eSewa payment integration
 */

const PaymentPage = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState(100);
  const [taxAmount, setTaxAmount] = useState(10);
  const [orderId, setOrderId] = useState("");
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const totalAmount = parseFloat(amount) + parseFloat(taxAmount);

  const handlePaymentInitiated = (paymentData) => {
    console.log("Payment initiated:", paymentData);
    setPaymentInitiated(true);
    // Show loading state or message
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    // Handle error display
  };

  if (!user) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-card">
            <p>Please log in to proceed with payment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-card">
          <h1>Payment</h1>
          <p className="subtitle">Complete your payment using eSewa</p>

          {/* Payment Summary */}
          <div className="payment-summary">
            <div className="summary-row">
              <span className="label">Subtotal:</span>
              <span className="value">Rs. {amount}</span>
            </div>
            <div className="summary-row">
              <span className="label">Tax (VAT):</span>
              <span className="value">Rs. {taxAmount}</span>
            </div>
            <div className="summary-row total">
              <span className="label">Total Amount:</span>
              <span className="value">Rs. {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount Input Fields */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="amount">Amount (Rs.)</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tax">Tax Amount (Rs.)</label>
              <input
                type="number"
                id="tax"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="Enter tax amount"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="orderId">Order ID (Optional)</label>
              <input
                type="text"
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
              />
            </div>
          </div>

          {/* eSewa Payment Button */}
          <div className="payment-button-section">
            <EsewaPaymentButton
              amount={amount}
              tax_amount={taxAmount}
              orderId={orderId || undefined}
              buttonText="Pay with eSewa"
              onPaymentInitiated={handlePaymentInitiated}
              onError={handlePaymentError}
            />
          </div>

          {/* Security Info */}
          <div className="security-info">
            <div className="info-box">
              <h3>Payment Security</h3>
              <ul>
                <li>✓ Secure SSL encryption</li>
                <li>✓ Verified eSewa gateway</li>
                <li>✓ No payment data stored locally</li>
                <li>✓ Signature verified on backend</li>
              </ul>
            </div>
          </div>

          {/* Info Message */}
          <div className="info-message">
            <p>
              <strong>Note:</strong> You will be redirected to eSewa payment gateway. 
              Your payment information is secure and encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
