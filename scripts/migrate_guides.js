import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import StudyGuide from '../src/models/StudyGuide.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoUri = process.env.MONGO_URI;

async function migrate() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("Connected successfully.");

        const guidesPath = path.join(__dirname, '..', 'src', 'db', 'guides.json');
        const data = await fs.readFile(guidesPath, 'utf8');
        const jsonGuides = JSON.parse(data);

        console.log(`Found ${jsonGuides.length} guides in JSON.`);

        for (const guide of jsonGuides) {
            const exists = await StudyGuide.findOne({ id: guide.id });
            if (exists) {
                console.log(`[Skip] Guide ${guide.title} already exists in DB.`);
                // Update interactive slides if they are newer
                if (guide.slides && (!exists.slides || exists.slides.length === 0)) {
                    console.log(`[Update] Adding slides to ${guide.title}`);
                    exists.slides = guide.slides;
                    exists.version = guide.version || '2.0';
                    await exists.save();
                }
            } else {
                console.log(`[Insert] Guide ${guide.title} into DB.`);
                await StudyGuide.create(guide);
            }
        }

        console.log("Migration complete.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
