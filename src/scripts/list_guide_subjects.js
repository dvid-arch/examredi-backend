
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db');
const guidesPath = path.join(dbPath, 'guides.json');

const listSubjects = async () => {
    try {
        const data = JSON.parse(await fs.readFile(guidesPath, 'utf-8'));
        const subjects = data.map(g => g.subject);
        console.log('Guide Subjects:', JSON.stringify(subjects, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
};

listSubjects();
