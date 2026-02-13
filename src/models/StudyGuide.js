import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
    type: { type: String, enum: ['content', 'question', 'summary'], required: true },
    title: { type: String },
    content: { type: String }, // Markdown
    image: { type: String },
    // For question slides
    question: { type: String },
    options: [{ type: String }],
    answer: { type: String },
    explanation: { type: String }
}, { _id: false });

const studyGuideSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Preservation of legacy IDs (e.g., sg1, sg1-interactive)
    title: { type: String, required: true },
    subject: { type: String, required: true, index: true },
    content: { type: String }, // General description or fallback
    slides: [slideSchema],
    version: { type: String, default: '1.0' },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const StudyGuide = mongoose.model('StudyGuide', studyGuideSchema);

export default StudyGuide;
