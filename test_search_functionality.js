import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './src/models/Paper.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/examredi';

async function verifySearch() {
    try {
        console.log(`Connecting to MongoDB at ${MONGO_URI.split('@').pop()}...`);
        try {
            await mongoose.connect(MONGO_URI);
            console.log('MongoDB Connected');
        } catch (error) {
            if (MONGO_URI !== 'mongodb://localhost:27017/examredi') {
                console.warn('Atlas connection failed. Falling back to local MongoDB...');
                await mongoose.connect('mongodb://localhost:27017/examredi');
                console.log('Local MongoDB Connected');
            } else {
                throw error;
            }
        }

        // 1. Test Keyword Search (Regex)
        console.log('\n--- Testing Keyword Search ---');
        const query = 'market';
        const startKeyword = Date.now();
        const keywordResults = await Paper.find({
            $or: [
                { 'questions.question': { $regex: query, $options: 'i' } },
                { 'questions.options.A.text': { $regex: query, $options: 'i' } },
                { 'questions.options.B.text': { $regex: query, $options: 'i' } },
                { 'questions.options.C.text': { $regex: query, $options: 'i' } },
                { 'questions.options.D.text': { $regex: query, $options: 'i' } }
            ]
        }).limit(5).lean();
        const endKeyword = Date.now();
        console.log(`Found ${keywordResults.length} papers containing "${query}" in ${endKeyword - startKeyword}ms`);
        if (keywordResults.length > 0) {
            console.log('Sample Paper:', keywordResults[0].subject, keywordResults[0].year);
        }

        // 2. Test Topic Match (searchByKeywords)
        console.log('\n--- Testing Topic Match ---');
        const targetTopic = 'Science of Living Things';
        const startTopic = Date.now();
        const topicResults = await Paper.find({
            'questions.topics': { $in: [targetTopic.toLowerCase()] }
        }).limit(5).lean();
        const endTopic = Date.now();
        console.log(`Found ${topicResults.length} papers with topic "${targetTopic}" in ${endTopic - startTopic}ms`);
        if (topicResults.length > 0) {
            console.log('Sample question topics:', topicResults[0].questions.find(q => q.topics && q.topics.length > 0).topics);
        }

        // 3. Test with Subject Filter
        console.log('\n--- Testing with Subject Filter ---');
        const subject = 'Biology';
        const filterTopic = 'Science of Living Things';
        const filteredResults = await Paper.find({
            subject: subject,
            'questions.topics': { $in: [filterTopic.toLowerCase()] }
        }).limit(5).lean();
        console.log(`Found ${filteredResults.length} Biology papers with topic "${filterTopic}"`);

    } catch (e) {
        console.error('Verification failed:', e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifySearch();
