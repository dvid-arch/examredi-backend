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

// Mapping to normalize subjects to frontend expectations
const SUBJECT_MAPPING = {
    'Accounts - Principles of Accounts': 'Accounting',
    'Agricultural Science': 'Agriculture',
    'Fine Arts': 'Fine Art',
    'Physical and Health Education': 'Physical and Health Education (PHE)'
};

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

        let subject = p.subject;
        // Normalize Subject Names to match guides.json (Frontend names)
        for (const [backendName, frontendName] of Object.entries(SUBJECT_MAPPING)) {
            if (p.subject === backendName) {
                subject = frontendName;
                break;
            }
        }

        // Filter out questions with missing required fields
        const validQuestions = p.questions.filter(q => q.question && q.answer).map(q => ({
            ...q,
            topics: (q.topics || []).map(t => t.toLowerCase())
        }));

        if (validQuestions.length === 0) return null;

        return {
            ...p,
            id: p.id,
            subject,
            questions: validQuestions
        };
    }).filter(Boolean);

    console.log(`Upserting ${validPapers.length} papers...`);

    for (const paperData of validPapers) {
        try {
            // Use updateOne with upsert to avoid overwriting user-saved tags (topics)
            // We only want to update structural fields, but KEEP questions' topics if they exist in DB

            const existingPaper = await Paper.findOne({ id: paperData.id });

            if (existingPaper) {
                // If paper exists, merge questions to preserve topics
                const mergedQuestions = paperData.questions.map(newQ => {
                    const dbQ = existingPaper.questions.find(q => q.id === newQ.id);
                    return {
                        ...newQ,
                        topics: (dbQ && dbQ.topics && dbQ.topics.length > 0) ? dbQ.topics : newQ.topics
                    };
                });

                await Paper.updateOne(
                    { id: paperData.id },
                    {
                        $set: {
                            subject: paperData.subject,
                            year: paperData.year,
                            type: paperData.type,
                            questions: mergedQuestions
                        }
                    }
                );
            } else {
                // New paper, just insert
                await new Paper(paperData).save();
            }
        } catch (e) {
            console.error(`\nError upserting paper ${paperData.id}:`, e.message);
        }
    }
    console.log('\nPapers synchronized successfully (Non-destructive).');
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
