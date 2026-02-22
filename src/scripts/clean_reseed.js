import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from '../models/Paper.js';
import { seedPapers } from './master_seeder.js';

dotenv.config();

async function cleanReseed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        console.log('Deleting ALL existing papers...');
        const result = await Paper.deleteMany({});
        console.log(`Deleted ${result.deletedCount} papers.`);

        console.log('Reseeding using upsert method...');
        await seedPapers();

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

cleanReseed();
