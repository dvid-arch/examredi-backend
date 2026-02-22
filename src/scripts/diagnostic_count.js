import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from '../models/Paper.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Paper.countDocuments();
        console.log(`Total papers in MongoDB: ${count}`);

        const results = await Paper.aggregate([
            {
                $group: {
                    _id: { subject: "$subject", year: "$year" },
                    count: { $sum: 1 },
                    ids: { $push: "$id" }
                }
            }
        ]);

        console.log(`Unique subject/year pairs in MongoDB: ${results.length}`);

        const collisions = results.filter(r => r.count > 1);
        if (collisions.length > 0) {
            console.log(`Collisions found: ${collisions.length}`);
            console.log('Sample collision:', JSON.stringify(collisions[0], null, 2));
        } else {
            console.log('No subject/year collisions in MongoDB.');
        }

        const subjects = await Paper.distinct('subject');
        console.log(`Total unique subjects in MongoDB: ${subjects.length}`);
        console.log(`Subjects: ${subjects.join(', ')}`);

        process.exit(0);
    } catch (error) {
        console.error('Error during diagnostic:', error);
        process.exit(1);
    }
}

run();
