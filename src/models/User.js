
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Changed from username to name to match frontend
    password: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Optional for now
    subscription: { type: String, enum: ['free', 'premium'], default: 'free' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    studyPlan: {
        targetScore: Number,
        weakSubjects: [String],
        dailyGoal: Number
    },
    // We can store performance summary here or in a separate collection
}, {
    timestamps: true
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
