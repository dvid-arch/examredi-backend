import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mimic the path logic in adminController.js
// controllers is in src/controllers
// topics.json is in src/db
const dbPath = path.join(__dirname, 'db'); // We are in root, so src/db
const topicsFilePath = path.join(dbPath, 'topics.json');

async function test() {
    console.log('__dirname:', __dirname);
    console.log('Resolved dbPath:', dbPath);
    console.log('Resolved topicsFilePath:', topicsFilePath);

    try {
        const data = await fs.readFile(topicsFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        console.log('SUCCESS: Read topics.json');
        console.log('Keys count:', Object.keys(parsed).length);
        console.log('First 3 keys:', Object.keys(parsed).slice(0, 3));
    } catch (err) {
        console.error('FAILURE:', err.message);
    }
}

test();
