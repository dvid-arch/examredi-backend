import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paper from './src/models/Paper.js';

dotenv.config();

async function checkIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const papers = await Paper.find({}).lean();
        console.log(`Total papers: ${papers.length}`);

        const missingId = papers.filter(p => !p.id);
        console.log(`Papers missing 'id' field: ${missingId.length}`);

        if (missingId.length > 0) {
            console.log('Examples of papers missing ID:');
            missingId.slice(0, 5).forEach(p => {
                console.log(`_id: ${p._id}, subject: ${p.subject}, year: ${p.year}`);
            });
        }

        const missingQuestionsId = papers.filter(p => p.questions.some(q => !q.id));
        console.log(`Papers with questions missing 'id' field: ${missingQuestionsId.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkIds();
