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

connectToDatabase()
const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`)})
