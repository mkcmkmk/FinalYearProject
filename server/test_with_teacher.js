import mongoose from "mongoose";
import User from "./models/User.js";
import { createSubscription } from "./controllers/paymentController.js";
import dotenv from "dotenv";

dotenv.config();

const runTest = async () => {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/user");
    console.log("Connected to MongoDB");

    // Check if the teacher exists
    const teacherId = "6a194eb1099dcc8b03e28a00";
    let teacher = await User.findById(teacherId);
    if (!teacher) {
      // Find any teacher instead
      teacher = await User.findOne({ role: "teacher" });
      if (!teacher) {
        // Create a teacher
        teacher = await User.create({
          name: "Test Teacher",
          email: `testteacher-${Date.now()}@example.com`,
          password: "hashedpassword123",
          role: "teacher",
          instrumentExpertise: "guitar, piano"
        });
      }
    }
    console.log(`Using teacher: ${teacher.name} - ID: ${teacher._id}`);

    // Create a student user
    const student = await User.create({
      name: "Test Student " + Math.random().toString(36).substring(2, 6),
      email: `teststudent-${Date.now()}@example.com`,
      password: "hashedpassword123",
      role: "student"
    });
    console.log(`Using student: ${student.name} (${student.email}) - ID: ${student._id}`);

    // Create a mock req and res
    const req = {
      user: student,
      body: {
        plan: "monthly",
        instrument: "piano",
        level: "beginner",
        teacherId: teacher._id.toString()
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
