
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const papersPath = path.join(__dirname, '..', 'db', 'all_papers.json');

const findMath = async () => {
    const stream = fs.createReadStream(papersPath, { encoding: 'utf8' });
    let buffer = '';
    const keywords = ['frac', 'sqrt', '^{', '_{'];

    for await (const chunk of stream) {
        buffer += chunk;
        // Keep buffer manageable, but ensure we don't cut keywords
        if (buffer.length > 1000000) {
            buffer = buffer.slice(-1000);
        }

        for (const kw of keywords) {
            const index = buffer.indexOf(kw);
            if (index !== -1) {
                // Found a keyword!
                // Let's assume the question is around here.
                // Find nearest "question" key backwards
                const contextStart = Math.max(0, index - 200);
                const contextEnd = Math.min(buffer.length, index + 200);
                console.log(`Found math keyword "${kw}":`);
                console.log(buffer.substring(contextStart, contextEnd));
                process.exit(0);
            }
        }
    }
    console.log('No math keywords found (or file processed without match).');
};

findMath();
