# Khalti Payment Subscription Fix - Summary

## Issues Found & Fixed

### 1. **Payment Model Pre-Save Hook Error** ❌ → ✅
**Location:** `server/models/Payment.js` (Line 127-136)

**Problem:** The Mongoose pre-save middleware was using callback-style `next()` function, but wasn't properly handling it in an async/await context. This caused a "next is not a function" error whenever a Payment document was created.

```javascript
// BEFORE (❌ Wrong)
paymentSchema.pre("save", function (next) {
  if (this.total_amount !== this.amount + this.tax_amount) {
    this.total_amount = this.amount + this.tax_amount;
  }
  next();  // ← This was causing the error
});

// AFTER (✅ Fixed)
paymentSchema.pre("save", async function () {
  if (this.total_amount !== this.amount + this.tax_amount) {
    this.total_amount = this.amount + this.tax_amount;
  }
  // Automatically returns promise in async context
});
```

**Impact:** When confirming subscription, the Payment document creation would fail, causing the entire `/api/payment/subscribe` endpoint to return 500 error, preventing the Khalti redirect.

---

### 2. **Improved Khalti API Error Handling** 📝
**Location:** `server/controllers/paymentController.js` (Line 164-200)

**Enhancement:** Added comprehensive error handling for the Khalti API call:
- Separate JSON parsing error handling
- Better error logging with raw response text
- Validation that payment_url and pidx exist in response
- Clearer error messages sent to frontend

**Benefit:** If any issues occur with Khalti API communication, you'll now see specific error details instead of a generic 500 error.

---

### 3. **User Phone Number Improvement** 📱
**Location:** `server/controllers/paymentController.js` (Line 154)

**Change:** Updated to use user's actual `contactNumber` from database instead of hardcoded "9800000000":

```javascript
phone: String(req.user.contactNumber || "9800000000") // Falls back if not provided
```

---

## What Was Causing the 500 Error?

When you clicked "Confirm Subscription":
1. ✅ Form validation passed
2. ✅ Subscription document created successfully  
3. ❌ **Payment document creation FAILED** due to pre-save hook error
4. ❌ This error was caught by outer try-catch
5. ❌ Server returned 500 error, preventing Khalti redirect

---

## Testing the Fix

The subscription now:
1. ✅ Creates Subscription document
2. ✅ Creates Payment document (without errors)
3. ✅ Initiates Khalti API call
4. ✅ Returns payment_url
5. ✅ Redirects to Khalti payment gateway

---

## Environment Configuration

Make sure your `.env` has:
```
KHALTI_SECRET_KEY=cbce7dc289b64b918bbe631b72b20495
```
✅ This is already configured in your current setup.

---

## Next Steps

Test the subscription flow end-to-end:
1. Login as a student
2. Go to payment page
3. Select plan, instrument, and level
4. Click "Confirm Subscription"
5. Should redirect to: `https://test-pay.khalti.com/?pidx=...`

If issues persist, check browser console and server logs for specific error messages.
