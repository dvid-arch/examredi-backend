import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate the path resolution in adminController.js
// adminController.js is in src/controllers
// We will place this script in src/controllers for accurate simulation, 
// OR we just adjust the paths to match where we run it from.
// Let's run it from the project root `be/examredi-backend`.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If we run this script from 'be/examredi-backend', __dirname is that folder.
// The controller expects to be in 'src/controllers'.
// So if we are in root, and we want to mimic 'src/controllers', 
// we should point to 'src/db'.

const dbPath = path.join(__dirname, 'src', 'db');
const usersFilePath = path.join(dbPath, 'users.json');
const papersFilePath = path.join(dbPath, 'papers.json');
const guidesFilePath = path.join(dbPath, 'guides.json');

console.log("Resolved DB Path:", dbPath);
console.log("Users File Path:", usersFilePath);

const readJsonFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const json = JSON.parse(data);
        console.log(`[Item] ${path.basename(filePath)} loaded. Count: ${Array.isArray(json) ? json.length : 'Not Array'}`);
        return json;
    } catch (error) {
        console.error(`[Error] Failed to read ${path.basename(filePath)}:`, error.message);
        return [];
    }
};

const run = async () => {
    console.log("--- Starting Admin Stats Debug ---");

    // Check if files exist
    try {
        await fs.access(usersFilePath);
        console.log("Users file exists.");
    } catch {
        console.error("Users file NOT found.");
    }

    const users = await readJsonFile(usersFilePath);
    const papers = await readJsonFile(papersFilePath);
    const guides = await readJsonFile(guidesFilePath);

    console.log("--- Stats ---");
    console.log("Users:", users.length);
    users.forEach(u => console.log(` - ${u.name} (${u.email}): ${u.role}`));
    console.log("Papers:", papers.length);
    console.log("Guides:", guides.length);

    if (Array.isArray(papers)) {
        const totalQuestions = papers.reduce((acc, paper) => acc + (paper.questions?.length || 0), 0);
        console.log("Total Questions:", totalQuestions);
    }
};

run();
