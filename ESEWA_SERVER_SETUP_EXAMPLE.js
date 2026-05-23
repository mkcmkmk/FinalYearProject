/**
 * EXAMPLE: How to integrate eSewa routes in your main server file
 * Copy this code into your main Express app file (e.g., index.js)
 */

// ===========================
// STEP 1: Import Dependencies
// ===========================

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import esewaRoutes from "./routes/esewa.js";
import authMiddleware from "./middleware/auth.js";

// Load environment variables
dotenv.config();

const app = express();

// ===========================
// STEP 2: Middleware Setup
// ===========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration (adjust origins for production)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// ===========================
// STEP 3: Connect MongoDB
// ===========================

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/payment-db")
  .then(() => console.log("✓ MongoDB connected"))
  .catch((err) => console.error("✗ MongoDB connection error:", err));

// ===========================
// STEP 4: Register eSewa Routes
// ===========================

// Mount payment routes
app.use("/api/payment", esewaRoutes);

// ===========================
// STEP 5: Other Routes (Example)
// ===========================

// Your other routes here
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// ===========================
// STEP 6: Health Check Endpoint
// ===========================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    payment_gateway: "eSewa enabled",
  });
});

// ===========================
// STEP 7: 404 Handler
// ===========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// ===========================
// STEP 8: Error Handler
// ===========================

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===========================
// STEP 9: Start Server
// ===========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🎉 Server running on port ${PORT}     ║
║  Environment: ${process.env.NODE_ENV || "development"}              ║
║  ✓ eSewa Payment Gateway Enabled       ║
║  ✓ MongoDB Connected                   ║
╚════════════════════════════════════════╝
  `);

  console.log("Available Routes:");
  console.log("  POST   /api/payment/esewa/initiate");
  console.log("  GET    /api/payment/esewa/success");
  console.log("  GET    /api/payment/esewa/failure");
  console.log("  GET    /api/payment/esewa/verify/:transaction_uuid");
  console.log("  GET    /api/payment/history");
  console.log("");
});

// ===========================
// STEP 10: Graceful Shutdown
// ===========================

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  app.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

export default app;

/**
 * COMPLETE SETUP CHECKLIST:
 * 
 * ☐ 1. Install dependencies:
 *      npm install crypto-js axios
 * 
 * ☐ 2. Create .env file with:
 *      ESEWA_MERCHANT_CODE=EPAYTEST
 *      ESEWA_SECRET_KEY=your_secret_key
 *      ESEWA_PRODUCT_CODE=EPAYTEST
 *      MONGODB_URI=mongodb://localhost:27017/payment-db
 *      JWT_SECRET=your_jwt_secret
 *      BACKEND_URL=http://localhost:3000
 *      FRONTEND_URL=http://localhost:5173
 *      NODE_ENV=development
 *      PORT=3000
 * 
 * ☐ 3. Create directory structure:
 *      server/
 *        ├── models/Payment.js
 *        ├── controllers/esewaController.js
 *        ├── services/esewa.service.js
 *        ├── routes/esewa.js
 *        ├── utils/signature.js
 *        └── middleware/auth.js
 * 
 * ☐ 4. Update your main server file (index.js):
 *      - Import esewaRoutes
 *      - Add: app.use("/api/payment", esewaRoutes);
 * 
 * ☐ 5. Frontend setup:
 *      - Add EsewaPaymentButton component
 *      - Add payment routes (success, failure)
 *      - Update payment API base URL if needed
 * 
 * ☐ 6. Test the integration:
 *      - Start backend: npm start
 *      - Start frontend: npm run dev
 *      - Try making a payment
 * 
 * ☐ 7. Production deployment:
 *      - Update credentials in .env
 *      - Set NODE_ENV=production
 *      - Update BACKEND_URL and FRONTEND_URL
 *      - Enable HTTPS
 *      - Set up payment notifications
 *      - Monitor logs
 */
