import "dotenv/config";
import mongoose from "mongoose";
import Payment from "./models/Payment.js";
import connectToDatabase from "./db/db.js";

await connectToDatabase();

try {
  const testPayment = await Payment.create({
    userId: new mongoose.Types.ObjectId(),
    studentName: "Test Student",
    transaction_uuid: `khalti-init-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    amount: 2500,
    total_amount: 2500,
    product_code: "KHALTI",
  });

  console.log("✅ Payment created successfully:", testPayment);
} catch (err) {
  console.error("❌ Error creating payment:", err.message);
  console.error("Details:", err);
} finally {
  await mongoose.connection.close();
  process.exit(0);
}
