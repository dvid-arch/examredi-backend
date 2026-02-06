import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const fixIndex = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const collection = mongoose.connection.collection('users');

        console.log('Listing indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        const usernameIndexInfo = indexes.find(idx => idx.name === 'username_1');

        if (usernameIndexInfo) {
            console.log('Found offending index "username_1". Dropping it...');
            await collection.dropIndex('username_1');
            console.log('Index dropped successfully!');
        } else {
            console.log('Index "username_1" not found. Nothing to do.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing index:', error);
        process.exit(1);
    }
};

fixIndex();
