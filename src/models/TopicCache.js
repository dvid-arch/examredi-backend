import mongoose from 'mongoose';

const topicCacheSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true,
        index: true
    },
    keywords: [{
        type: String
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Unique index for the combination of topic and subject
topicCacheSchema.index({ topic: 1, subject: 1 }, { unique: true });

const TopicCache = mongoose.model('TopicCache', topicCacheSchema);

export default TopicCache;
