import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`)})
