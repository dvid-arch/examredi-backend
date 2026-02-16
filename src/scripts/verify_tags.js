
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const papersPath = path.join(__dirname, '..', 'db', 'papers.json');

try {
    const data = fs.readFileSync(papersPath, 'utf8');
    const papers = JSON.parse(data);

    const questionsToCheck = [
        "joystick",
        "WAN",
        "pregnancy",
        "inventory",
        "triple jump",
        "Lyttleton"
    ];

    console.log("Verifying tags for specific keywords:\n");

    questionsToCheck.forEach(keyword => {
        let found = false;
        papers.forEach(p => {
            p.questions.forEach(q => {
                if (q.question.toLowerCase().includes(keyword.toLowerCase())) {
                    if (!found) { // Just check the first occurrence to avoid spam
                        console.log(`[KEYWORD: ${keyword}]`);
                        console.log(`Question: ${q.question.substring(0, 100)}...`);
                        console.log(`Subject: ${p.subject}`);
                        console.log(`Topics: ${JSON.stringify(q.topics || [])}`);
                        console.log('-'.repeat(40));
                        found = true;
                    }
                }
            });
        });
        if (!found) {
            console.log(`[KEYWORD: ${keyword}] NOT FOUND in any question.`);
            console.log('-'.repeat(40));
        }
    });

} catch (error) {
    console.error("Error:", error.message);
}
