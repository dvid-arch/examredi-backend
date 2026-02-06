
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Check for and drop deprecated 'username_1' index
        try {
            const collection = mongoose.connection.collection('users');
            const indexes = await collection.indexes();
            const usernameIndex = indexes.find(index => index.name === 'username_1');

            if (usernameIndex) {
                await collection.dropIndex('username_1');
                console.log('Dropped deprecated index: username_1');
            }
        } catch (indexError) {
            console.warn('Error checking/dropping username_1 index (non-fatal):', indexError.message);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
