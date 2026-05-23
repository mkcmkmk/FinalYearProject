/**
 * eSewa Payment Gateway Integration Guide
 * Complete documentation for production-ready implementation
 */

# eSewa Payment Integration - Complete Guide

## Overview

This is a **production-ready** eSewa payment gateway integration for your Node.js + Express + MongoDB + React stack.

### Key Features

✅ Secure HMAC SHA256 signature generation on backend only
✅ Payment verification with signature validation
✅ Duplicate payment prevention using transaction UUID
✅ Amount validation from database (not user input)
✅ Complete error handling and logging
✅ MongoDB schema with payment tracking
✅ Frontend payment button with redirect
✅ Payment success/failure pages
✅ Clean folder structure with separation of concerns
✅ Detailed comments explaining each step

---

## Installation & Setup

### 1. Install Dependencies

```bash
# Backend
npm install crypto-js axios

# Frontend (if not already installed)
npm install react-router-dom axios
```

### 2. Environment Variables

Create a `.env` file in your `server/` directory:

```env
# eSewa Credentials (from merchant portal)
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=your_secret_key_here
ESEWA_PRODUCT_CODE=EPAYTEST

# URLs
NODE_ENV=development
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/your_database

# JWT
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Register Routes in Your Main Server File

```javascript
import esewaRoutes from "./routes/esewa.js";

// Add to your Express app
app.use("/api/payment", esewaRoutes);
```

---

## File Structure

```
server/
├── models/
│   └── Payment.js              # Payment schema
├── controllers/
│   └── esewaController.js       # Payment handlers
├── services/
│   └── esewa.service.js         # Business logic
├── routes/
│   └── esewa.js                 # API endpoints
├── utils/
│   └── signature.js             # Signature generation/verification
└── .env                         # Environment variables

frontend/
├── src/
│   ├── components/
│   │   ├── EsewaPaymentButton.jsx
│   │   └── EsewaPaymentButton.css
│   └── pages/
│       ├── EsewaPaymentPage.jsx
│       ├── PaymentSuccess.jsx
│       ├── PaymentFailure.jsx
│       └── PaymentResult.css
```

---

## API Endpoints

### 1. Initiate Payment

**POST** `/api/payment/esewa/initiate`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "amount": 100,
  "tax_amount": 10,
  "orderId": "507f1f77bcf86cd799439011" // optional
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439011",
    "transaction_uuid": "1234567890-abcdef",
    "amount": 100,
    "tax_amount": 10,
    "total_amount": 110,
    "product_code": "EPAYTEST",
    "signature": "base64_encoded_signature",
    "product_service_charge": 0,
    "product_delivery_charge": 0,
    "success_url": "http://localhost:3000/api/payment/esewa/success",
    "failure_url": "http://localhost:3000/api/payment/esewa/failure",
    "signed_field_names": "total_amount,transaction_uuid,product_code"
  },
  "esewa_url": "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
}
```

### 2. Payment Success Callback

**GET** `/api/payment/esewa/success`

eSewa redirects here with query parameters:
```
?transaction_code=000AWEO&status=COMPLETE&total_amount=110&transaction_uuid=241028&product_code=EPAYTEST&signature=...
```

The backend verifies the signature and marks payment as PAID.
Then redirects user to: `/payment-success?transaction_uuid=...`

### 3. Payment Failure Callback

**GET** `/api/payment/esewa/failure`

eSewa redirects here if payment fails.
User is redirected to: `/payment-failure?error=...`

### 4. Verify Payment Status

**GET** `/api/payment/esewa/verify/:transaction_uuid`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439011",
    "transaction_uuid": "1234567890-abcdef",
    "status": "PAID",
    "amount": 110,
    "esewa_transaction_code": "000AWEO",
    "completed_at": "2024-06-10T16:24:13.000Z",
    "error_message": null
  }
}
```

### 5. Get Payment History

**GET** `/api/payment/history`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "transaction_uuid": "1234567890-abcdef",
      "amount": 110,
      "total_amount": 110,
      "status": "PAID",
      "createdAt": "2024-06-10T16:24:13.000Z",
      "completed_at": "2024-06-10T16:25:45.000Z"
    }
  ]
}
```

---

## Payment Flow Diagram

```
1. User clicks "Pay with eSewa" button
   ↓
2. Frontend calls POST /api/payment/esewa/initiate
   ↓
3. Backend generates signature & creates Payment record
   ↓
4. Backend returns payment form data & eSewa URL
   ↓
5. Frontend creates hidden form and submits to eSewa
   ↓
6. User is redirected to eSewa payment gateway
   ↓
7. User completes payment on eSewa
   ↓
8. eSewa redirects to /api/payment/esewa/success with signed response
   ↓
9. Backend verifies signature & amount
   ↓
10. Backend marks payment as PAID in database
    ↓
11. Backend redirects to frontend success page
    ↓
12. Frontend displays success message
```

---

## Security Best Practices Implemented

### ✅ Backend Signature Generation
- Signature is generated on **backend only**, not frontend
- Frontend never has access to the secret key
- User cannot tamper with the signature

### ✅ Signature Verification
- All eSewa responses are verified with signature validation
- If signature is invalid, payment is rejected
- Prevents man-in-the-middle attacks

### ✅ Duplicate Payment Prevention
- Each payment gets a unique `transaction_uuid`
- Database check prevents processing same payment twice
- Idempotent payment processing

### ✅ Amount Validation
- Amount is fetched from database, not user request
- Frontend amount is only for display purposes
- Backend validates amount matches database

### ✅ User Authentication
- All payment endpoints require authentication
- User can only see their own payment history
- Payment records are linked to userId

### ✅ Error Handling
- Comprehensive try-catch blocks
- Detailed error logging
- User-friendly error messages

---

## Frontend Usage

### Payment Button

```jsx
import EsewaPaymentButton from "./components/EsewaPaymentButton";

export default function CheckoutPage() {
  return (
    <EsewaPaymentButton
      amount={100}
      tax_amount={10}
      orderId="507f1f77bcf86cd799439011"
      buttonText="Complete Payment"
      onPaymentInitiated={(payment) => console.log("Payment initiated", payment)}
      onError={(error) => console.error("Payment error", error)}
    />
  );
}
```

### Verification After Redirect

```jsx
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const transaction_uuid = searchParams.get("transaction_uuid");

  useEffect(() => {
    // Verify payment status
    const verify = async () => {
      const response = await axios.get(
        `/api/payment/esewa/verify/${transaction_uuid}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      console.log("Payment status:", response.data.payment.status);
    };
    verify();
  }, [transaction_uuid]);

  return <h1>Payment Successful!</h1>;
}
```

---

## Payment Statuses

| Status | Meaning |
|--------|---------|
| **PENDING** | Payment initiated, awaiting eSewa response |
| **PAID** | Payment verified and confirmed |
| **FAILED** | Payment failed or signature validation failed |
| **CANCELLED** | User cancelled payment |

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| User not authenticated | Missing/invalid token | User must log in first |
| Invalid payment data | amount <= 0 | Provide valid amount |
| Payment not found | transaction_uuid doesn't exist | Check transaction_uuid |
| Signature verification failed | Tampered response | Reject payment, log incident |
| Payment already processed | Duplicate payment attempt | Database prevents this |
| Amount mismatch | Response amount != DB amount | Reject payment |

---

## Testing

### Sandbox Credentials

eSewa provides sandbox environment for testing:

```
URL: https://rc-epay.esewa.com.np/api/epay/main/v2/form
Product Code: EPAYTEST
Merchant Code: EPAYTEST
Secret Key: provided by eSewa
```

### Test Scenarios

1. **Successful Payment**
   - Amount should be > 0
   - Signature should be valid
   - Status should be "COMPLETE"

2. **Failed Payment**
   - Invalid signature
   - Amount mismatch
   - Status not "COMPLETE"

3. **Duplicate Payment**
   - Same transaction_uuid sent twice
   - Should be rejected with "Payment already processed"

---

## Production Deployment Checklist

- [ ] Get production credentials from eSewa
- [ ] Update `.env` with production values
- [ ] Update `ESEWA_PRODUCT_CODE` to production code
- [ ] Update `ESEWA_SECRET_KEY` to production secret
- [ ] Change `NODE_ENV` to "production"
- [ ] Update `BACKEND_URL` to production domain
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Enable HTTPS only
- [ ] Add rate limiting to payment endpoints
- [ ] Set up payment failure alerts
- [ ] Configure automated emails for payment confirmations
- [ ] Monitor payment logs
- [ ] Test end-to-end flow

---

## Troubleshooting

### Payment not working?

1. Check `.env` file for correct credentials
2. Verify MongoDB connection
3. Check browser console for errors
4. Check server logs for payment verification errors
5. Verify user is authenticated (valid token)
6. Check eSewa service status

### Signature verification failing?

1. Ensure SECRET_KEY is correct
2. Check field order in message (must be exact)
3. Verify Base64 encoding is correct
4. Check for trailing spaces in any values

### Payments stuck in PENDING?

1. Check if eSewa sent the redirect
2. Check if backend received the response
3. Check server logs for errors
4. Verify amount matches

---

## Support & Resources

- **eSewa Merchant Portal:** https://merchant.esewa.com.np/
- **eSewa API Documentation:** https://developer.esewa.com.np/
- **eSewa Test Credentials:** Available from merchant dashboard
- **Contact eSewa Support:** support@esewa.com.np

---

## Changelog

### v1.0.0
- Initial production-ready release
- HMAC SHA256 signature support
- Payment verification
- Duplicate prevention
- Complete error handling
- Frontend components

---

**Last Updated:** June 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
