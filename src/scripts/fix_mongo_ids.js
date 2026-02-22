import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Paper from '../models/Paper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const papersFilePath = path.join(__dirname, '../db/all_papers.json');

async function fixMongoIds() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            return;
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        console.log('Reading all_papers.json...');
        const data = await fs.readFile(papersFilePath, 'utf8');
        const papers = JSON.parse(data);

        console.log(`Found ${papers.length} papers in JSON file.`);

        let updatedCount = 0;
        let notFoundCount = 0;

        for (const p of papers) {
            // Find by subject and year since 'id' might be missing in DB
            const result = await Paper.updateOne(
                { subject: p.subject, year: p.year },
                { $set: { id: p.id } }
            );

            if (result.matchedCount > 0) {
                updatedCount++;
            } else {
                notFoundCount++;
            }

            if (updatedCount % 50 === 0) {
                console.log(`Progress: ${updatedCount} updated...`);
            }
        }

        console.log('--- SYNC COMPLETE ---');
        console.log(`Total Updated: ${updatedCount}`);
        console.log(`Total Not Found: ${notFoundCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error fixing IDs:', error);
        process.exit(1);
    }
}

fixMongoIds();
