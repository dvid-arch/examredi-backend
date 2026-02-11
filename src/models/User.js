
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Changed from username to name to match frontend
    password: { type: String, required: false }, // Optional for OAuth users
    email: { type: String, unique: true, sparse: true }, // Optional for now
    googleId: { type: String, unique: true, sparse: true },
    subscription: { type: String, enum: ['free', 'pro'], default: 'free' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    studyPlan: {
        targetScore: { type: Number, default: 250 },
        weakSubjects: { type: [String], default: [] },
        dailyGoal: { type: Number, default: 10 }
    },
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastDate: { type: Date },
        history: [{ type: String }] // Array of 'YYYY-MM-DD' strings
    },
    recentActivity: [{
        id: String,
        type: { type: String, enum: ['quiz', 'guide', 'game'] },
        title: String,
        path: String,
        state: mongoose.Schema.Types.Mixed,
        status: { type: String, enum: ['completed', 'in_progress', 'abandoned'] },
        score: String,
        progress: Number,
        dismissedAt: Date,
        timestamp: { type: Date, default: Date.now }
    }],
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // We can store performance summary here or in a separate collection
}, {
    timestamps: true
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to hash password
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

import crypto from 'crypto';

// ... (previous code)

// Generate Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Generate Email Verification Token
userSchema.methods.getVerificationToken = function () {
    const verificationToken = crypto.randomBytes(20).toString('hex');

    this.verificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    return verificationToken;
};

const User = mongoose.model('User', userSchema);

export default User;
