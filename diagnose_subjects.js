
import mongoose from 'mongoose';
import Paper from './src/models/Paper.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const countBySubject = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const subjects = await Paper.distinct('subject');
        console.log(`Found ${subjects.length} unique subjects in DB.`);

        const counts = {};
        for (const s of subjects) {
            counts[s] = await Paper.countDocuments({ subject: s });
            console.log(`${s}: ${counts[s]}`);
        }

        fs.writeFileSync('subject_counts.json', JSON.stringify(counts, null, 2));
        console.log('Finished. Results written to subject_counts.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

countBySubject();
