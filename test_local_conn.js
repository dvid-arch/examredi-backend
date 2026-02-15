import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testLocalConn = async () => {
    const localUri = 'mongodb://localhost:27017/examredi';
    try {
        console.log('Testing connection to local MongoDB:', localUri);
        await mongoose.connect(localUri);
        console.log('Successfully connected to local MongoDB!');
        process.exit(0);
    } catch (error) {
        console.error('Local connection failed:', error.message);
        process.exit(1);
    }
};

testLocalConn();
