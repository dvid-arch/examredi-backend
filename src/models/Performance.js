
import mongoose from 'mongoose';

const performanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, default: 'practice' } // 'practice', 'exam', 'challenge'
}, {
    timestamps: true
});

const Performance = mongoose.model('Performance', performanceSchema);

export default Performance;
