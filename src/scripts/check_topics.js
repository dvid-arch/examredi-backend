
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db');
const allPapersPath = path.join(dbPath, 'all_papers.json');

const checkTopics = async () => {
    try {
        console.log('Reading all_papers.json...');
        const data = await fs.readFile(allPapersPath, 'utf-8');
        const papers = JSON.parse(data);

        let totalQuestions = 0;
        let taggedQuestions = 0;
        let subjects = new Set();
        let sampleTags = [];

        papers.forEach(p => {
            subjects.add(p.subject);
            p.questions.forEach(q => {
                totalQuestions++;
                if (q.topics && q.topics.length > 0) {
                    taggedQuestions++;
                    if (sampleTags.length < 5) sampleTags.push(q.topics);
                }
            });
        });

        console.log(`Total Papers: ${papers.length}`);
        console.log(`Total Questions: ${totalQuestions}`);
        console.log(`Tagged Questions: ${taggedQuestions}`);
        console.log(`Tagging Coverage: ${((taggedQuestions / totalQuestions) * 100).toFixed(2)}%`);
        console.log('Subjects:', Array.from(subjects).join(', '));
        if (sampleTags.length > 0) console.log('Sample Tags:', JSON.stringify(sampleTags));

    } catch (error) {
        console.error('Error:', error);
    }
};

checkTopics();
