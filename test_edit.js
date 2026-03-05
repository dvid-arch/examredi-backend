import mongoose from 'mongoose';
import Paper from './src/models/Paper.js';

async function run() {
    await mongoose.connect('mongodb://127.0.0.1:27017/examredi');
    console.log('Connected to DB');

    const paper = await Paper.findOne({});
    if (!paper) {
        console.log('No paper found');
        process.exit(0);
    }

    console.log('Original paper id:', paper.id, paper._id);
    const qIndex = 0;
    console.log('Original question:', paper.questions[qIndex].question);

    paper.questions[qIndex].question = paper.questions[qIndex].question + ' Edited';
    await paper.save();

    const updatedPaper = await Paper.findOne({ _id: paper._id });
    console.log('Updated paper id:', updatedPaper.id, updatedPaper._id);
    console.log('Updated question:', updatedPaper.questions[qIndex].question);

    const count = await Paper.countDocuments();
    console.log('Total papers:', count);

    process.exit(0);
}

run().catch(console.error);
