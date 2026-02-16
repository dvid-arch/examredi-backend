import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Paper from '../models/Paper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const papersFilePath = path.join(__dirname, '../db/papers.json');

const seedPapers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        const data = await fs.readFile(papersFilePath, 'utf8');
        const papers = JSON.parse(data);

        // Clear existing papers (Optional: user can uncomment if needed)
        // await Paper.deleteMany({});
        // console.log('Cleared existing papers.');

        console.log(`Starting seed of ${papers.length} papers...`);

        // Use insertMany for efficiency
        await Paper.insertMany(papers, { ordered: false });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedPapers();
