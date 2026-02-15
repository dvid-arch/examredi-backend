
import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
    text: { type: String, required: false },
    diagram: { type: String, default: null }
}, { _id: false });

const questionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    question: { type: String, required: true },
    options: {
        A: optionSchema,
        B: optionSchema,
        C: optionSchema,
        D: optionSchema
    },
    answer: { type: String, required: true }, // 'A', 'B', 'C', or 'D'
    questionDiagram: { type: String, default: null }, // URL or path
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
