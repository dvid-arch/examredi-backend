
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Paper from '../models/Paper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const papersFilePath = path.join(__dirname, '..', 'db', 'all_papers.json');

const seedDatabase = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log(`Reading data from ${papersFilePath}...`);
        const data = fs.readFileSync(papersFilePath, 'utf8');
        const papers = JSON.parse(data);

        console.log(`Found ${papers.length} papers to seed.`);

        // Clear existing data
        console.log('Clearing existing papers...');
        await Paper.deleteMany({});
        console.log('Existing papers cleared.');

        // Insert new data
        console.log('Inserting new papers...');
        await Paper.insertMany(papers);
        console.log('Papers inserted successfully.');

        console.log('Database seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
