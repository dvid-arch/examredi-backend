import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Guide from '../models/Guide.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const guidesFilePath = path.join(__dirname, '..', 'db', 'guide.json');

const seedGuides = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log(`Reading data from ${guidesFilePath}...`);
        const data = fs.readFileSync(guidesFilePath, 'utf8');
        const guides = JSON.parse(data);

        console.log(`Found ${guides.length} guides to seed.`);

        // Clear existing data
        console.log('Clearing existing guides...');
        await Guide.deleteMany({});
        console.log('Existing guides cleared.');

        // Insert new data
        console.log('Inserting new guides...');
        await Guide.insertMany(guides);
        console.log('Guides inserted successfully.');

        console.log('Guides seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding guides:', error);
        process.exit(1);
    }
};

seedGuides();
