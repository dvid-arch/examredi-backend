import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const papersPath = path.join(__dirname, '..', 'db', 'papers.json');

try {
    const data = fs.readFileSync(papersPath, 'utf8');
    const papers = JSON.parse(data);

    const subjects = [...new Set(papers.map(p => p.subject))];
    console.log("Subjects found:", subjects);

    const physicsPaper = papers.find(p => p.subject === 'Physics');
    if (physicsPaper) {
        console.log("Found Physics paper:", physicsPaper.subject, physicsPaper.year);
        console.log("Total Questions:", physicsPaper.questions.length);
        if (physicsPaper.questions.length > 0) {
            console.log("First 5 Question IDs:", physicsPaper.questions.slice(0, 5).map(q => q.id));

            // Check specifically for the user's question about decay
            const decayQ = physicsPaper.questions.find(q => q.question.toLowerCase().includes('decay'));
            if (decayQ) {
                console.log("Found Decay Question:", decayQ.id);
                console.log("Tags:", decayQ.topics);
            }
        }
    } else {
        console.log("No paper with subject 'Physics' found.");
        // Check for 'utme-phy' just in case
        const utmePhy = papers.find(p => p.id && p.id.includes('utme-phy'));
        if (utmePhy) console.log("Found by ID utme-phy:", utmePhy.subject);
    }
} catch (error) {
    console.error("Error:", error.message);
}
