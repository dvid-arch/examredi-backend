import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from '../models/Paper.js';

dotenv.config();

const countPapers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Paper.countDocuments();
        console.log(`Total papers in MongoDB: ${count}`);

        // Also check if there's any specific field that might be limiting them
        const subjects = await Paper.distinct('subject');
        console.log(`Unique subjects: ${subjects.length}`);
        console.log(`Subjects: ${subjects.join(', ')}`);

        process.exit(0);
    } catch (error) {
        console.error('Error counting papers:', error);
        process.exit(1);
    }
};

countPapers();
