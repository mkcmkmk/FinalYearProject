/**
 * eSewa Integration - Quick Reference Guide
 * Quick lookup for all important information
 */

# eSewa Integration - Quick Reference

## 📁 Files Created

| File | Purpose |
|------|---------|
| `server/models/Payment.js` | Mongoose schema for payments |
| `server/controllers/esewaController.js` | Request handlers |
| `server/services/esewa.service.js` | Business logic & payment service |
| `server/routes/esewa.js` | API endpoints |
| `server/utils/signature.js` | HMAC SHA256 signature utilities |
| `frontend/src/components/EsewaPaymentButton.jsx` | Payment button component |
| `frontend/src/components/EsewaPaymentButton.css` | Button styles |
| `frontend/src/pages/EsewaPaymentPage.jsx` | Payment page example |
| `frontend/src/pages/PaymentSuccess.jsx` | Success redirect page |
| `frontend/src/pages/PaymentFailure.jsx` | Failure redirect page |
| `frontend/src/pages/PaymentHistory.jsx` | Payment history page |
| `frontend/src/pages/PaymentResult.css` | Result pages styles |
| `frontend/src/pages/PaymentHistory.css` | History page styles |
| `frontend/src/pages/PaymentPage.css` | Payment page styles |

---

## 🚀 Quick Start (3 Steps)

### 1. Update Server File
```javascript
import esewaRoutes from "./routes/esewa.js";
app.use("/api/payment", esewaRoutes);
```

### 2. Add Environment Variables
```env
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=your_secret_key_here
ESEWA_PRODUCT_CODE=EPAYTEST
```

### 3. Use Payment Button in Frontend
```jsx
import EsewaPaymentButton from "./components/EsewaPaymentButton";

<EsewaPaymentButton amount={100} tax_amount={10} />
```

---

## 📌 API Endpoints

```
POST   /api/payment/esewa/initiate
GET    /api/payment/esewa/success
GET    /api/payment/esewa/failure
GET    /api/payment/esewa/verify/:transaction_uuid
GET    /api/payment/history
```

---

## 🔐 Security Checklist

- ✅ Signature generated on backend only
- ✅ All responses verified with signature
- ✅ Duplicate payments prevented
- ✅ Amounts validated from database
- ✅ User authentication required
- ✅ Comprehensive error handling
- ✅ Payment records tracked in MongoDB
- ✅ Transaction UUID for idempotency

---

## 💾 Database Schema

```javascript
Payment {
  userId: ObjectId,
  transaction_uuid: String,        // Unique ID
  amount: Number,                  // Base amount
  tax_amount: Number,              // Tax
  total_amount: Number,            // Amount + Tax
  status: "PENDING|PAID|FAILED|CANCELLED",
  esewa_transaction_code: String,  // eSewa's ref
  signature: String,               // Signed by eSewa
  esewa_response: Mixed,           // Full response
  createdAt: Date,
  updatedAt: Date,
  completed_at: Date
}
```

---

## 🔄 Payment Flow

```
Frontend Button Click
        ↓
POST /api/payment/esewa/initiate
        ↓
Backend generates signature
        ↓
Response with payment form data
        ↓
Frontend submits form to eSewa
        ↓
User pays on eSewa
        ↓
eSewa redirects to /api/payment/esewa/success
        ↓
Backend verifies signature & amount
        ↓
Mark payment as PAID
        ↓
Redirect to frontend success page
        ↓
Display success message
```

---

## 📝 Environment Variables Required

```env
# eSewa Credentials
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=your_secret_here
ESEWA_PRODUCT_CODE=EPAYTEST

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/payment-db

# JWT
JWT_SECRET=your_jwt_secret_here
```

---

## 🛠️ Signature Generation Example

```javascript
import CryptoJS from "crypto-js";

const payload = {
  total_amount: 110,
  transaction_uuid: "123456-abc",
  product_code: "EPAYTEST"
};

const message = `total_amount=${payload.total_amount},transaction_uuid=${payload.transaction_uuid},product_code=${payload.product_code}`;
const hash = CryptoJS.HmacSHA256(message, SECRET_KEY);
const signature = CryptoJS.enc.Base64.stringify(hash);
```

---

## ✅ Testing Checklist

- [ ] Payment initiation works
- [ ] Redirect to eSewa works
- [ ] Success callback received
- [ ] Signature verification passes
- [ ] Amount validation works
- [ ] Payment marked as PAID
- [ ] Duplicate payment blocked
- [ ] Payment history shows payment
- [ ] Failure handling works
- [ ] Error messages display properly

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Signature verification failed" | Check SECRET_KEY in .env, verify field order |
| "User not authenticated" | Ensure token is passed in Authorization header |
| "Payment not found" | Check transaction_uuid is correct |
| "Amount mismatch" | Verify DB amount matches eSewa response |
| "Payment already processed" | Different transaction_uuid or allow duplicate |

---

## 📊 Payment Statuses

| Status | When | Action |
|--------|------|--------|
| PENDING | Payment initiated | Waiting for eSewa response |
| PAID | Verified successfully | Update order/subscription |
| FAILED | Signature/amount invalid | Notify user, allow retry |
| CANCELLED | User cancelled | Allow retry payment |

---

## 🔗 Frontend Component Usage

### Basic Usage
```jsx
<EsewaPaymentButton amount={100} />
```

### Full Usage
```jsx
<EsewaPaymentButton
  amount={100}
  tax_amount={10}
  orderId="order_123"
  buttonText="Pay Now"
  onPaymentInitiated={(data) => console.log(data)}
  onError={(error) => console.error(error)}
/>
```

### With Router
```jsx
import { useNavigate } from "react-router-dom";

function Checkout() {
  const navigate = useNavigate();
  
  return (
    <EsewaPaymentButton
      amount={100}
      onPaymentInitiated={() => navigate("/payment-pending")}
      onError={(err) => navigate(`/payment-error?msg=${err}`)}
    />
  );
}
```

---

## 📱 Frontend Routes Needed

```jsx
// Add to your React Router
<Route path="/pay" element={<EsewaPaymentPage />} />
<Route path="/payment-success" element={<PaymentSuccess />} />
<Route path="/payment-failure" element={<PaymentFailure />} />
<Route path="/payment/history" element={<PaymentHistory />} />
```

---

## 🧪 Testing with Sandbox

**Sandbox URL:** https://rc-epay.esewa.com.np/api/epay/main/v2/form

**Test Credentials:**
- Merchant Code: EPAYTEST
- Product Code: EPAYTEST
- Secret Key: provided by eSewa

---

## 📚 Key Functions

### Backend Functions

```javascript
// Generate payment
const result = await initiatePayment({ userId, amount, tax_amount });

// Verify eSewa response
const verified = await verifyPayment(esewa_response);

// Get payment status
const status = await getPaymentStatus(transaction_uuid);

// User's payment history
const history = await getUserPaymentHistory(userId);

// Handle failure
await handlePaymentFailure(transaction_uuid, reason);
```

### Frontend Functions

```javascript
// Generate signature (never do this - backend only!)
// NOT IMPLEMENTED - server side only

// Verify payment
const response = await axios.get(
  `/api/payment/esewa/verify/${uuid}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// Get history
const response = await axios.get(
  `/api/payment/history`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## 🎯 Next Steps

1. **Install dependencies:**
   ```bash
   npm install crypto-js
   ```

2. **Copy files to your project**

3. **Update .env file**

4. **Register routes in main server file**

5. **Add payment pages to React Router**

6. **Test with eSewa sandbox**

7. **Deploy to production**

---

## 📞 Support Resources

- **eSewa Merchant Portal:** https://merchant.esewa.com.np/
- **eSewa API Docs:** https://developer.esewa.com.np/
- **Contact:** support@esewa.com.np

---

## 💡 Pro Tips

1. **Always verify server-side** - Never trust frontend success redirects
2. **Use transaction UUID** - Prevents duplicate payment processing
3. **Log everything** - Makes debugging easier
4. **Rate limit payments** - Prevent spam/abuse
5. **Monitor payment failures** - Alert on suspicious activity
6. **Test thoroughly** - Use sandbox environment first
7. **Keep secret key safe** - Never commit to version control
8. **Add retry logic** - Network failures happen

---

**Last Updated:** June 2024  
**Status:** Production Ready ✅  
**Version:** 1.0.0
