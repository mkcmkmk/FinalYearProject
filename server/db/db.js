import mongoose from "mongoose";

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
    }catch (error) {
        console.error("Database connection error:", error);
    }
}
export default connectToDatabase;