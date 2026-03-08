import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './src/models/Paper.js';
import User from './src/models/User.js';
import { getPapers } from './src/controllers/dataController.js';

dotenv.config();

const testUserAccess = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User ${email} not found.`);
            return;
        }

        console.log(`\n--- Testing access for ${user.email} (Role: ${user.role}) ---`);

        const req = {
            query: {},
            user: user
        };

        const res = {
            json: (data) => {
                console.log(`Result count: ${data.length}`);
                const maxYear = Math.max(...data.map(p => p.year));
                console.log(`Max year found: ${maxYear}`);
                if (maxYear > 2000 && user.role !== 'admin') {
                    console.log("FAIL: Restriction not respected!");
                } else {
                    console.log("SUCCESS: Restriction working.");
                }
            },
            status: () => res
        };

        await getPapers(req, res);
    } catch (error) {
        console.error(error);
    }
};

const run = async () => {
    // Test a known user
    await testUserAccess('abdurroheemsherifdeen@gmail.com'); // role=user
    await testUserAccess('derrickemma44@gmail.com'); // role=admin
    process.exit(0);
};

run();
