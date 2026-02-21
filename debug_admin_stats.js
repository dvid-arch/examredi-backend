import mongoose from 'mongoose';
import Paper from './src/models/Paper.js';
import User from './src/models/User.js';
import Guide from './src/models/Guide.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifyStats() {
    try {
        const localUri = 'mongodb://localhost:27017/examredi';
        await mongoose.connect(localUri);

        const userCount = await User.countDocuments();
        const paperCount = await Paper.countDocuments();
        const guideCount = await Guide.countDocuments();

        const stats = await Paper.aggregate([
            { $project: { questionCount: { $size: "$questions" } } },
            { $group: { _id: null, totalQuestions: { $sum: "$questionCount" } } }
        ]);

        const totalQuestions = stats.length > 0 ? stats[0].totalQuestions : 0;

        console.log('--- DB Stats ---');
        console.log('Users:', userCount);
        console.log('Papers:', paperCount);
        console.log('Questions:', totalQuestions);
        console.log('Guides:', guideCount);

        if (paperCount === 611) {
            console.log('SUCCESS: Paper count matches expected 611.');
        } else {
            console.log('FAILURE: Paper count is', paperCount, 'expected 611.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyStats();
