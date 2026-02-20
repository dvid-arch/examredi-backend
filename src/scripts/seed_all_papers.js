
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

// Mapping to normalize subjects to frontend expectations
const SUBJECT_MAPPING = {
    'Accounts - Principles of Accounts': 'Accounting',
    'Agricultural Science': 'Agriculture',
    'Fine Arts': 'Fine Art',
    'Physical and Health Education': 'Physical and Health Education (PHE)'
};

// Reverse mapping for the seed script:
// The database file has 'Counts - Principles of Accounts' but frontend wants 'Accounting'
// Wait, my previous mapping in dataController was Frontend -> Backend.
// Here I want to store them in MongoDB. 
// If I store them as 'Accounts - Principles of Accounts', the frontend will need the mapping forever.
// IF I store them as 'Accounting', the frontend can just use 'Accounting' directly!
// But wait, the Frontend *requests* 'Accounting'.
// If I change the data in DB to 'Accounting', then `dataController` needs to STOP mapping or map differently.
// 
// Let's look at `dataController.js` again.
// It maps `req.query.subject` (Frontend Name) -> `dbSubject` (Backend/File Name).
// If I change the Backend Name to match Frontend Name during seed, I can remove the mapping in `dataController`?
// 
// However, `dataController` reads from the JSON file OR MongoDB.
// If it reads from JSON, it NEEDS the mapping because the JSON file has 'Accounts...'.
// If it reads from MongoDB, and I normalize it here, then it won't need mapping?
// 
// `dataController.js` currently reads from `readJsonFile(papersFilePath)`. It does NOT use MongoDB for `getPapers` yet!
// The `seedPapers.js` script imports `Paper` model but `dataController.js` uses `readJsonFile`.
// 
// Ah, `dataController.js` gets papers from the JSON file directly in `getPapers`!
// 
// `export const getPapers = async (req, res) => { ... const allPapers = await readJsonFile(papersFilePath); ... }`
// 
// So seeding the MongoDB `Paper` collection won't actually affect the app *unless* I update `dataController.js` to read from MongoDB `Paper` model instead of the JSON file.
// 
// The user asked to "seed backend". This usually implies putting data into the database.
// But the current app runs off JSON files for papers.
// 
// If I seed MongoDB, I should probably also update `dataController.js` to use MongoDB, essentially migrating fully to DB.
// That would be a "Phase 6" or similar.
// 
// For now, I will create the seed script as requested.
// I will ALSO update the data in the seed script to use the "Frontend" subject names if possible, 
// OR keep them as is and rely on the mapping.
// 
// Use the SAME Logic as the JSON file to allow easy switching?
// No, standardizing to the "Guides" names (Frontend names) is better for long term.
// 
// let's do this:
// 1. Logic to seed keys: Normalize Subject Names to match `guides.json` (Frontend names).
// 2. Logic to seed: Insert.
// 
// Note: If I run this, it populates MongoDB. It does NOT change the active `dataController`.
// I should ask the user if they want to switch to MongoDB or just seed it.
// The prompted request was "how about seeding backend with the new papers".
// I will provide the script and running it.

// Export for use in index.js
export const seedPapers = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            return;
        }

        // Check if connection is already established (when called from index.js)
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('Connected to MongoDB...');
        }

        console.log('Reading all_papers.json...');
        const data = await fs.readFile(papersFilePath, 'utf8');
        const papers = JSON.parse(data);

        console.log(`Loaded ${papers.length} papers.`);

        // Normalize Data
        const normalizedPapers = papers.map(p => {
            let subject = p.subject;
            // Check if this subject needs mapping (Inverted from dataController)
            // dataController: Frontend -> Backend
            // Here: Backend -> Frontend (so we store "Accounting" instead of "Accounts...")

            // Iterate my mapping to find the key for this value?
            // "Accounting": "Accounts - Principles of Accounts"
            // If p.subject === "Accounts - Principles of Accounts", set subject = "Accounting"

            for (const [frontendName, backendName] of Object.entries(SUBJECT_MAPPING)) {
                if (p.subject === backendName) {
                    subject = frontendName;
                    break;
                }
            }

            return {
                ...p,
                subject
            };
        });

        console.log('Clearing existing Paper collection...');
        await Paper.deleteMany({});

        console.log('Inserting papers in batches of 500...');
        const batchSize = 500;
        for (let i = 0; i < normalizedPapers.length; i += batchSize) {
            const batch = normalizedPapers.slice(i, i + batchSize);
            await Paper.insertMany(batch, { ordered: false });
            console.log(`Inserted ${i + batch.length} / ${normalizedPapers.length}`);
        }

        console.log('Database seeded successfully!');

        // Only exit if run as a standalone script
        if (process.argv[1] === fileURLToPath(import.meta.url)) {
            process.exit(0);
        }
    } catch (error) {
        console.error('Error seeding database:', error);
        if (process.argv[1] === fileURLToPath(import.meta.url)) {
            process.exit(1);
        }
    }
};

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedPapers();
}
