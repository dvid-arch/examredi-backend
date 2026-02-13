import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
}

async function checkDb() {
    try {
        await mongoose.connect(mongoUri);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        for (const col of collections) {
            if (col.name.toLowerCase().includes('guide')) {
                const data = await mongoose.connection.db.collection(col.name).find().limit(1).toArray();
                console.log(`\nSample data from ${col.name}:`, JSON.stringify(data, null, 2));
            }
        }

        const paperHasGuides = await mongoose.connection.db.collection('papers').findOne({ type: 'guide' });
        if (paperHasGuides) {
            console.log("\nFound guides inside 'papers' collection!");
        } else {
            console.log("\nNo guides found in 'papers' collection (where type='guide').");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error checking DB:", err);
    }
}

checkDb();
