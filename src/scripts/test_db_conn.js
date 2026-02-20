
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('Testing MongoDB Connection...');
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');

        // Log masked URI for verification
        const uri = process.env.MONGO_URI;
        console.log(`URI: ${uri.substring(0, 15)}...${uri.substring(uri.length - 10)}`);

        await mongoose.connect(uri);
        console.log('Connection Successful!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Connection Failed:', error.message);
    }
};

testConnection();
