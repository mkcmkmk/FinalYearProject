import mongoose from "mongoose";    
// import { url } from "node:inspector";
// import { type } from "node:os";
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
    image:{
        url:{
            type: String,
        }
    },
    contactNumber:{
        type: Number,
        required: false,
    },
    isMember:{
        type: Boolean,
        default: false,
    },
    isTeacher:{
        type: Boolean,
        default: false,
    },
     resetToken: {
        type: String, // Token for password reset
        default: null, // Default value is null
    },
    resetTokenExpiry: {
        type: Date, // Expiry date for the reset token
        default: null, // Default value is null
    },
    UpdatedAt: {
        type: Date,
        default: Date.now,
    }, 
});
const User = mongoose.model("User", userSchema);
export default User;