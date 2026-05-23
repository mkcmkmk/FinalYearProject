import User from './models/User.js';
import bcrypt from 'bcrypt';
import connectToDatabase from './db/db.js';

const resetAdmin = async () => {
    await connectToDatabase();
    try {
        const hashPassword = await bcrypt.hash("Test@123", 10);
        const user = await User.findOneAndUpdate(
            { email: "admin@gmail.com" },
            { password: hashPassword, role: "admin" },
            { new: true, upsert: true }
        );
        console.log("Admin account reset/created successfully:", user.email);
        process.exit(0);
    } catch (error) {
        console.error("Error resetting admin:", error);
        process.exit(1);
    }
};

resetAdmin();
