import mongoose from 'mongoose';

const subTopicSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    keywords: [String]
}, { _id: false });

const topicSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    subTopics: [subTopicSchema]
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
