// import mongoose from "mongoose";

// const connectToDatabase = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("MongoDB connected ✅");
//   } catch (error) {
//     console.error("Database connection error:", error);
//     process.exit(1);
//   }
// };

// export default connectToDatabase;
import mongoose from "mongoose";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // ✅ FIXED
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1); // ✅ stop server if DB not connected
  }
};

export default connectToDatabase;
