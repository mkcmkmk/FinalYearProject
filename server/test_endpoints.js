import "dotenv/config";
import axios from "axios";
import mongoose from "mongoose";
import connectToDatabase from "./db/db.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";

await connectToDatabase();

// Create a completely new test user with unique email
const uniqueEmail = `testuser-${Date.now()}@example.com`;
const testUser = await User.create({
  name: "Test Student " + Date.now(),
  email: uniqueEmail,
  password: "hashed_password",
  role: "student",
  contactNumber: 9841234567
});
console.log("✅ Created fresh test user:", testUser._id);

// Generate JWT token
const token = jwt.sign({ id: testUser._id }, process.env.JWT_KEY);
console.log("✅ Generated token");

const API_BASE = "http://localhost:3000";
const headers = { Authorization: `Bearer ${token}` };

// Test 1: Get Statements (should be empty)
console.log("\n--- Test 1: Get Statements ---");
try {
  const res = await axios.get(`${API_BASE}/api/payment/statements`, { headers });
  console.log("✅ GET /api/payment/statements");
  console.log("Payments count:", res.data.payments.length);
} catch (err) {
  console.error("❌ Error:", err.response?.data || err.message);
}

// Test 2: Create Subscription
console.log("\n--- Test 2: Create Subscription ---");
try {
  const res = await axios.post(`${API_BASE}/api/payment/subscribe`, {
    plan: "monthly",
    instrument: "Guitar",
    level: "beginner",
    teacherId: null
  }, { headers, timeout: 10000 });
  console.log("✅ POST /api/payment/subscribe");
  console.log("Payment URL:", res.data.payment_url);
  console.log("PIDX:", res.data.pidx);
  console.log("Success:", res.data.success);
} catch (err) {
  console.error("❌ Error:", err.response?.data || err.message);
  if (err.response?.data?.error) {
    console.error("Error details:", err.response.data.error);
  }
}

await mongoose.connection.close();
process.exit(0);
