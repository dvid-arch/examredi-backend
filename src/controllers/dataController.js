import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const papersFilePath = path.join(dbPath, 'papers.json');
const guidesFilePath = path.join(dbPath, 'guides.json');
const leaderboardFilePath = path.join(dbPath, 'leaderboard.json');
const performanceFilePath = path.join(dbPath, 'performance.json');

const readJsonFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeJsonFile = async (filePath, data) => {
    await fs.mkdir(dbPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// @desc    Get past papers
// @route   GET /api/data/papers
export const getPapers = async (req, res) => {
    const { subject, year } = req.query;
    let papers = await readJsonFile(papersFilePath);

    if (subject) {
        papers = papers.filter(p => p.subject.toLowerCase() === (subject).toLowerCase());
    }
    if (year) {
        papers = papers.filter(p => p.year === Number(year));
    }

    res.json(papers);
};

// @desc    Get study guides
// @route   GET /api/data/guides
export const getGuides = async (req, res) => {
    const guides = await readJsonFile(guidesFilePath);
    res.json(guides);
};

// @desc    Get leaderboard
// @route   GET /api/data/leaderboard
export const getLeaderboard = async (req, res) => {
    const leaderboard = await readJsonFile(leaderboardFilePath);
    res.json(leaderboard.sort((a, b) => b.score - a.score));
};

// @desc    Add score to leaderboard
// @route   POST /api/data/leaderboard
export const addLeaderboardScore = async (req, res) => {
    const newScore = req.body;
    let leaderboard = await readJsonFile(leaderboardFilePath);
    
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b.score - a.score);
    
    if (leaderboard.length > 10) {
        leaderboard = leaderboard.slice(0, 10);
    }

    await writeJsonFile(leaderboardFilePath, leaderboard);
    res.status(201).json(leaderboard);
};

// @desc    Get user performance results
// @route   GET /api/data/performance
export const getPerformance = async (req, res) => {
    const userId = req.user?.id;
    const allResults = await readJsonFile(performanceFilePath);
    const userResults = allResults[userId] || [];
    res.json(userResults);
};

// @desc    Add a performance result
// @route   POST /api/data/performance
export const addPerformanceResult = async (req, res) => {
    const userId = req.user?.id;
    const newResult = req.body;
    
    const allResults = await readJsonFile(performanceFilePath);
    
    if (!allResults[userId]) {
        allResults[userId] = [];
    }
    
    allResults[userId].unshift(newResult);
    
    await writeJsonFile(performanceFilePath, allResults);
    res.status(201).json(newResult);
};
