import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './src/models/Paper.js';
import { getPapers, searchPapers, searchByTopic } from './src/controllers/dataController.js';

dotenv.config();

// Mock res
const res = {
    json: (data) => {
        console.log(`[Test] Result count: ${Array.isArray(data) ? data.length : 'object'}`);
        if (Array.isArray(data)) {
            const years = data.map(p => p.year);
            const outsideRange = years.filter(y => y > 2000);
            if (outsideRange.length > 0) {
                console.log(`[Test] [FAIL] Found papers with years: ${[...new Set(outsideRange)].join(', ')}`);
            } else {
                console.log(`[Test] [PASS] All papers are within year <= 2000`);
            }
        }
    },
    status: (code) => {
        console.log(`[Status] ${code}`);
        return res;
    }
};

const runTests = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("--- Connected to DB ---");

        console.log("\n--- TEST: Admin Access (Full) ---");
        const adminReq = {
            query: { subject: 'Mathematics' },
            user: { role: 'admin' }
        };
        await getPapers(adminReq, res);

        console.log("\n--- TEST: Pro User Access (Restricted to <= 2000) ---");
        const proReq = {
            query: { subject: 'Mathematics' },
            user: { role: 'user', subscription: 'pro' }
        };
        await getPapers(proReq, res);

        console.log("\n--- TEST: Search (Pro User, Restricted) ---");
        const proSearchReq = {
            query: { query: 'solving' },
            user: { role: 'user', subscription: 'pro' }
        };
        await searchPapers(proSearchReq, res);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTests();
