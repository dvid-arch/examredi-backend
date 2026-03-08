import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const auditUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'name email role subscription').lean();
        console.log("User Audit:");
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}): role=${u.role}, sub=${u.subscription}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

auditUsers();
