import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String },
    keywords: [String],
    videos: [{
        id: String,
        title: String,
        youtubeId: String,
        type: { type: String, enum: ['study-hack', 'tutorial', 'explanation'] },
        duration: String
    }],
    inlineQuestions: [{
        id: String,
        triggerHeader: String,
        question: String,
        options: [String],
        answer: String,
        explanation: String
    }]
}, { _id: false });

const guideSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    subject: { type: String, required: true, index: true },
    lastUpdated: { type: String },
    topics: [topicSchema]
}, {
    timestamps: true
});

const Guide = mongoose.model('Guide', guideSchema);

export default Guide;
