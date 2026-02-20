
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'src', 'db'); // Adjusted path based on typical structure
// Actually, looking at previous ls, it seems src/db is where files are. 
// Let's assume script is in src/scripts, so ../db is correct relative to __dirname (src/scripts)

const papersPath = path.join(__dirname, '..', 'db', 'papers.json');
const allPapersPath = path.join(__dirname, '..', 'db', 'all_papers.json');

// Simple string normalization for matching
const normalize = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .trim();
};

const migrateTags = async () => {
    try {
        console.log('Loading datasets...');
        const oldData = JSON.parse(await fs.readFile(papersPath, 'utf-8'));
        const newData = JSON.parse(await fs.readFile(allPapersPath, 'utf-8'));

        console.log(`Loaded ${oldData.length} old papers and ${newData.length} new papers.`);

        // Build a lookup map for old questions
        // Key: Normalized Question Text -> Value: Topics Array
        const topicMap = new Map();
        let sourceTaggedCount = 0;

        oldData.forEach(paper => {
            paper.questions.forEach(q => {
                if (q.topics && q.topics.length > 0) {
                    const key = normalize(q.question);
                    if (key.length > 10) { // Ignore very short questions to avoid bad matches
                        if (!topicMap.has(key)) {
                            topicMap.set(key, q.topics);
                            sourceTaggedCount++;
                        }
                    }
                }
            });
        });

        console.log(`Found ${sourceTaggedCount} unique tagged questions in source.`);

        let matchedCount = 0;
        let visitedQuestions = 0;

        // Iterate new data and apply tags
        newData.forEach(paper => {
            paper.questions.forEach(q => {
                visitedQuestions++;
                const key = normalize(q.question);

                if (topicMap.has(key)) {
                    const tags = topicMap.get(key);
                    // Only apply if currently empty (though we know they are 0%)
                    if (!q.topics || q.topics.length === 0) {
                        q.topics = tags;
                        matchedCount++;
                    }
                } else {
                    // Initialize empty array if missing
                    if (!q.topics) q.topics = [];
                }
            });
        });

        console.log(`Migration Complete.`);
        console.log(`Visited: ${visitedQuestions}`);
        console.log(`Matched & Tagged: ${matchedCount}`);
        console.log(`Coverage: ${((matchedCount / visitedQuestions) * 100).toFixed(2)}%`);

        if (matchedCount > 0) {
            console.log('Saving updated all_papers.json...');
            await fs.writeFile(allPapersPath, JSON.stringify(newData, null, 2));
            console.log('Saved.');
        } else {
            console.log('No matches found. Check normalization logic?');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    }
};

migrateTags();
