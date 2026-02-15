import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Paper from '../models/Paper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const papersFilePath = path.join(__dirname, '../db/papers.json');

export const autoSeedPapers = async () => {
    try {
        console.log('--- STARTING AUTO-SEED PROCESS ---');

        const data = await fs.readFile(papersFilePath, 'utf8');
        const papers = JSON.parse(data);

        // Clear existing papers (as requested: seed regardless of populated or not)
        await Paper.deleteMany({});
        console.log('Cleared existing papers.');

        console.log(`Seeding ${papers.length} papers...`);

        // Use insertMany for efficiency
        await Paper.insertMany(papers, { ordered: false });

        console.log('Database seeded successfully!');
        console.log('--- AUTO-SEED PROCESS COMPLETE ---');
    } catch (error) {
        console.error('Error during auto-seeding:', error);
        // We don't exit process here to allow the server to still try and start
    }
};
