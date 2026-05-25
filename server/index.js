import "dotenv/config";
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import connectToDatabase from './db/db.js'
import paymentRoutes from "./routes/payment.js";
import userRoutes from "./routes/users.js";
import subscriptionRoutes from "./routes/subscription.js";
import teacherRoutes from "./routes/teacher.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";
import aiRoutes from "./routes/ai.js";
import tasksRoutes from "./routes/tasks.js";

connectToDatabase()
const app = express()
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))
app.use('/api/auth', authRoutes)
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/teacher", teacherRoutes);
console.log("Teacher routes loaded (includes POST /api/teacher/groups/delete)");
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tasks", tasksRoutes);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`)})
