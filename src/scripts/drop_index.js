import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function dropIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const db = mongoose.connection.db;

        // List all collections to find the right name
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Try both possible names
        for (const collName of ['papers', 'paper']) {
            try {
                const collection = db.collection(collName);
                const indexes = await collection.indexes();
                console.log(`\nIndexes on '${collName}':`, JSON.stringify(indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })), null, 2));

                // Drop the unique compound index if it exists
                for (const idx of indexes) {
                    if (idx.key && idx.key.subject && idx.key.year && idx.unique) {
                        await collection.dropIndex(idx.name);
                        console.log(`Dropped unique index: ${idx.name} from '${collName}'`);
                    }
                }
            } catch (e) {
                console.log(`Collection '${collName}' not found or error:`, e.message);
            }
        }

        console.log('\nDone.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

dropIndex();
