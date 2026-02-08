import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Paper from '../models/Paper.js';
import Leaderboard from '../models/Leaderboard.js';
import Performance from '../models/Performance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const papersFilePath = path.join(dbPath, 'papers.json');
const guidesFilePath = path.join(dbPath, 'guides.json');
const leaderboardFilePath = path.join(dbPath, 'leaderboard.json');
const performanceFilePath = path.join(dbPath, 'performance.json');
const literatureFilePath = path.join(dbPath, 'literature.json');

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
    try {
        const { subject, year } = req.query;
        const allPapers = await readJsonFile(papersFilePath);

        let papers = allPapers;

        if (subject) {
            const subjectLower = subject.toLowerCase();
            papers = papers.filter(p => p.subject.toLowerCase() === subjectLower);
        }

        if (year) {
            const yearNum = Number(year);
            papers = papers.filter(p => p.year === yearNum);
        }

        // --- GUEST/FREE LIMITS ---
        // If user is not pro, limit questions per paper to 10
        const isPro = req.user && req.user.subscription === 'pro';

        if (!isPro) {
            papers = papers.map(paper => ({
                ...paper,
                questions: paper.questions.slice(0, 10),
                isLimited: true // Hint to UI
            }));
        }

        res.json(papers);
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Search past questions by keyword
// @route   GET /api/data/search
export const searchPapers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const lowerQuery = query.toLowerCase();
        const allPapers = await readJsonFile(papersFilePath);

        const results = [];
        allPapers.forEach(paper => {
            paper.questions.forEach(q => {
                const questionText = (q.question || '').toLowerCase();
                const optionsText = q.options ? Object.values(q.options).map(o => (o.text || '').toLowerCase()).join(' ') : '';

                if (questionText.includes(lowerQuery) || optionsText.includes(lowerQuery)) {
                    results.push({
                        ...q,
                        subject: paper.subject,
                        year: paper.year,
                        exam: paper.exam
                    });
                }
            });
        });

        // Limit results for performance
        res.json(results.slice(0, 50));
    } catch (error) {
        console.error('Error searching papers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
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
    try {
        const leaderboard = await Leaderboard.find().sort({ score: -1, date: -1 }).limit(20);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add score to leaderboard
// @route   POST /api/data/leaderboard
export const addLeaderboardScore = async (req, res) => {
    try {
        const { name, totalQuestions, answers, date, score: clientScore } = req.body;

        let finalScore = clientScore;

        // --- SERVER-SIDE VERIFICATION ---
        if (answers && typeof answers === 'object') {
            const allPapers = await readJsonFile(papersFilePath);
            const allQuestions = allPapers.flatMap(p => p.questions);

            let verifiedScore = 0;
            Object.keys(answers).forEach(qId => {
                const question = allQuestions.find(q => q.id === qId);
                if (question && question.answer === answers[qId]) {
                    verifiedScore++;
                }
            });

            console.log(`Score Verification: Client=${clientScore}, Verified=${verifiedScore}`);
            finalScore = verifiedScore;
        }

        const newScore = new Leaderboard({
            name,
            score: finalScore,
            totalQuestions: totalQuestions || 0,
            date: date || Date.now()
        });

        await newScore.save();

        // Return the updated top 20
        const leaderboard = await Leaderboard.find().sort({ score: -1, date: -1 }).limit(20);
        res.status(201).json(leaderboard);
    } catch (error) {
        console.error('Error adding leaderboard score:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Remove the scattered import later


// @desc    Get user performance results
// @route   GET /api/data/performance
export const getPerformance = async (req, res) => {
    try {
        const userId = req.user?.id;
        const isPro = req.user?.subscription === 'pro';

        if (!isPro) {
            return res.status(403).json({ message: "Performance tracking is an ExamRedi Pro feature." });
        }

        const userResults = await Performance.find({ userId }).sort({ date: -1 });
        res.json(userResults);
    } catch (error) {
        console.error('Error fetching performance:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a performance result
// @route   POST /api/data/performance
export const addPerformanceResult = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            paperId,
            exam,
            subject,
            year,
            score,
            totalQuestions,
            type,
            topicBreakdown,
            incorrectQuestions,
            completedAt
        } = req.body;

        const newResult = new Performance({
            userId,
            subject,
            score,
            totalQuestions,
            type: type || 'practice',
            topicBreakdown,
            incorrectQuestions,
            date: completedAt || Date.now(),
            metadata: {
                paperId,
                exam,
                year
            }
        });

        await newResult.save();
        res.status(201).json(newResult);
    } catch (error) {
        console.error('Error adding performance result:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get literature books
// @route   GET /api/data/literature
export const getLiterature = async (req, res) => {
    const literature = await readJsonFile(literatureFilePath);
    res.json(literature);
};

