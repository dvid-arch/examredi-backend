
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../src/db/connect.js';
import Paper from '../src/models/Paper.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const papersFilePath = path.join(__dirname, '../src/db/papers.json');

const migrateData = async () => {
    try {
        await connectDB();

        console.log('Reading local data...');
        if (!fs.existsSync(papersFilePath)) {
            console.error('papers.json not found!');
            process.exit(1);
        }

        const rawData = fs.readFileSync(papersFilePath, 'utf-8');
        const papers = JSON.parse(rawData);

        console.log(`Found ${papers.length} papers to migrate.`);

        // Clear existing papers to avoid duplicates (optional, strictly safe for re-running)
        await Paper.deleteMany({});
        console.log('Cleared existing Paper collection.');

        for (const paper of papers) {
            // Validate data integrity
            if (!paper.subject || !paper.year || !paper.questions) {
                console.warn(`Skipping invalid paper: ${JSON.stringify(paper).substring(0, 50)}...`);
                continue;
            }

            // Create document
            await Paper.create({
                subject: paper.subject,
                year: parseInt(paper.year, 10),
                type: 'UTME', // Defaulting to UTME as per current scope
                questions: paper.questions.map((q, index) => ({
                    id: index + 1, // Ensure sequential IDs
                    text: q.question, // Mapping 'question' to 'text' schema field
                    option_a: q.option_a || q.A, // Handle variations
                    option_b: q.option_b || q.B,
                    option_c: q.option_c || q.C,
                    option_d: q.option_d || q.D,
                    correct_option: q.answer,
                    image: q.image || null,
                    explanation: q.explanation || ""
                }))
            });
            console.log(`Migrated: ${paper.subject} ${paper.year}`);
        }

        console.log('Migration Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

migrateData();
