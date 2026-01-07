import mongoose from "mongoose";    
import { type } from "node:os";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {type: String, enum: ['admin', 'teacher','student'], required: true},
    profileImage: {
        type: String,},
    createdAt: {
        type: Date,
        default: Date.now,
    },
    UpdatedAt: {
        type: Date,
        default: Date.now,
    }, 
});
const User = mongoose.model("User", userSchema);
export default User;