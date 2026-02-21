import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Guide from '../models/Guide.js';
import Paper from '../models/Paper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Atlas connection string from environment variables
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
    if (!MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }
    try {
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Connection failed:', error.message);
        throw error;
    }
}

export async function seedGuides() {
    const guidesFilePath = path.join(__dirname, '../db/guide.json');
    console.log(`Seeding Guides from ${guidesFilePath}...`);

    const data = await fs.readFile(guidesFilePath, 'utf8');
    const guides = JSON.parse(data);

    console.log('Clearing existing guides...');
    await Guide.deleteMany({});

    console.log(`Inserting ${guides.length} guides...`);
    await Guide.insertMany(guides);
    console.log('Guides seeded successfully.');
}

export async function seedPapers(customPath = null) {
    const papersFilePath = customPath || path.join(__dirname, '../db/all_papers.json');
    console.log(`Seeding Papers from ${papersFilePath}...`);

    const data = await fs.readFile(papersFilePath, 'utf8');
    const papers = JSON.parse(data);

    // Filter and Normalize
    const validPapers = papers.map(p => {
        if (!p.subject || !Array.isArray(p.questions)) return null;

        // Filter out questions with missing required fields
        const validQuestions = p.questions.filter(q => q.question && q.answer).map(q => ({
            ...q,
            topics: (q.topics || []).map(t => t.toLowerCase())
        }));

        if (validQuestions.length === 0) return null;

        return {
            ...p,
            questions: validQuestions
        };
    }).filter(Boolean);

    console.log('Clearing existing papers...');
    await Paper.deleteMany({});

    console.log(`Inserting ${validPapers.length} papers in batches...`);
    const batchSize = 100;
    for (let i = 0; i < validPapers.length; i += batchSize) {
        const batch = validPapers.slice(i, i + batchSize);
        try {
            await Paper.insertMany(batch, { ordered: false });
        } catch (e) {
            console.error(`\nBatch error at index ${i}:`, e.message);
        }
        process.stdout.write(`\rProgress: ${i + batch.length}/${validPapers.length}`);
    }
    console.log('\nPapers seeded successfully.');
}

async function runSeeder() {
    try {
        await connectDB();

        const action = process.argv[2]; // 'guides', 'papers', or 'all'
        const customPaperPath = process.argv[3]; // e.g., be/examredi-backend/src/db/all_papers_tagged.json

        if (action === 'guides' || action === 'all' || !action) {
            await seedGuides();
        }

        if (action === 'papers' || action === 'all' || !action) {
            await seedPapers(customPaperPath);
        }

        console.log('Seeding process completed!');
        process.exit(0);
    } catch (error) {
        console.error('Seeder failed:', error);
        process.exit(1);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runSeeder();
}
