import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const papersPath = path.join(__dirname, '..', 'db', 'papers.json');

try {
    const data = fs.readFileSync(papersPath, 'utf8');
    const papers = JSON.parse(data);

    const stats = {};
    const untaggedSamples = {};

    papers.forEach(paper => {
        const subject = paper.subject;
        if (!stats[subject]) {
            stats[subject] = { total: 0, tagged: 0, untagged: 0 };
            untaggedSamples[subject] = [];
        }

        paper.questions.forEach(q => {
            stats[subject].total++;
            if (q.topics && q.topics.length > 0) {
                stats[subject].tagged++;
            } else {
                stats[subject].untagged++;
                // Keep a sample of 10-20 untagged questions per subject
                if (untaggedSamples[subject].length < 20) {
                    untaggedSamples[subject].push(q.question);
                }
            }
        });
    });

    console.log("Tagging Statistics:");
    console.table(Object.entries(stats).map(([k, v]) => ({
        Subject: k,
        Total: v.total,
        Tagged: v.tagged,
        Untagged: v.untagged,
        Coverage: Math.round((v.tagged / v.total) * 100) + '%'
    })));

    console.log("\n--- Untagged Samples (First 5 per subject) ---");
    for (const [subject, samples] of Object.entries(untaggedSamples)) {
        if (samples.length > 0) {
            console.log(`\n[${subject}]`);
            samples.slice(0, 5).forEach(exam => console.log(`- ${exam.substring(0, 100)}...`));
        }
    }

} catch (error) {
    console.error("Error:", error.message);
}
