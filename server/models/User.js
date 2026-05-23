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
    googleId: {
        type: String,
        default: null,
        index: true,
        sparse: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {type: String, enum: ['admin', 'teacher','student'], required: true},
    profileImage: {
        type: String,},
    instrumentExpertise: {
        type: String,
        default: "",
        trim: true,
    },
    yearsOfExperience: {
        type: Number,
        default: null,
        min: 0,
    },
    teacherBio: {
        type: String,
        default: "",
        trim: true,
    },
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
        type: String,
        default: null,
    },
    resetTokenExpiry: {
        type: Date,
        default: null,
    },
    UpdatedAt: {
        type: Date,
        default: Date.now,
    }, 
});
const User = mongoose.model("User", userSchema);
export default User;
