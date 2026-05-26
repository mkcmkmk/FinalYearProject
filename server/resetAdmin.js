import User from "./models/User.js";
import bcrypt from "bcrypt";
import connectToDatabase from "./db/db.js";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Test@123";

const resetAdmin = async () => {
  await connectToDatabase();
  try {
    const hashPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const user = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        name: "Admin",
        email: ADMIN_EMAIL,
        password: hashPassword,
        role: "admin",
        isTeacher: false,
        isMember: false,
        UpdatedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log("Admin account reset successfully.");
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error("Error resetting admin:", error);
    process.exit(1);
  }
};

resetAdmin();
