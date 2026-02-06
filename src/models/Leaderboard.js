
import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
    username: { type: String, required: true },
    score: { type: Number, required: true },
    subject: { type: String, required: true }, // 'General' or specific subject
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

export default Leaderboard;
