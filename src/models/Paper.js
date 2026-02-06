
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    text: { type: String, required: true },
    option_a: { type: String, required: false },
    option_b: { type: String, required: false }, // Relaxed validation for migration
    option_c: { type: String, required: false },
    option_d: { type: String, required: false },
    correct_option: { type: String, required: true }, // 'A', 'B', 'C', or 'D'
    image: { type: String, default: null }, // URL or path
    explanation: { type: String, default: "" }
}, { _id: false }); // Disable auto-ID for subdocuments if we want to preserve original IDs or just keep it simple

const paperSchema = new mongoose.Schema({
    subject: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },
    type: { type: String, default: 'UTME' }, // 'UTME', 'WASSCE', etc.
    questions: [questionSchema]
}, {
    timestamps: true
});

// Compound index to ensure unique papers per subject/year
paperSchema.index({ subject: 1, year: 1 }, { unique: true });

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;
