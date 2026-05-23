import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Subscription from "./models/Subscription.js";
import Payment from "./models/Payment.js";
import { createSubscription } from "./controllers/paymentController.js";
import dotenv from "dotenv";

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/user");
    console.log("Connected to MongoDB");

    console.log("Creating new student user...");
    const user = await User.create({
      name: "Test Student " + Math.random().toString(36).substring(2, 6),
      email: `teststudent-${Date.now()}@example.com`,
      password: "hashedpassword123",
      role: "student"
    });
    console.log(`Using user: ${user.name} (${user.email}) - ID: ${user._id}`);

    // Create a mock req and res objects
    const req = {
      user: user,
      body: {
        plan: "monthly",
        instrument: "guitar",
        level: "beginner",
        teacherId: null
      }
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        console.log(`Response Status: ${this.statusCode}`);
        console.log("Response Data:", JSON.stringify(data, null, 2));
      }
    };

    console.log("Calling createSubscription...");
    await createSubscription(req, res);
  } catch (err) {
    console.error("Test runner crashed with:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  }
};

runTest();
