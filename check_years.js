import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './src/models/Paper.js';

dotenv.config();

const checkYears = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const years = await Paper.aggregate([
            { $group: { _id: "$year", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        console.log("Paper distribution by year:");
        years.forEach(y => console.log(`${y._id}: ${y.count}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkYears();
