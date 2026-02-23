import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Paper from '../models/Paper.js';
import Leaderboard from '../models/Leaderboard.js';
import Performance from '../models/Performance.js';
import Guide from '../models/Guide.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const topicsFilePath = path.join(dbPath, 'topics.json');
const leaderboardFilePath = path.join(dbPath, 'leaderboard.json');
const performanceFilePath = path.join(dbPath, 'performance.json');
const literatureFilePath = path.join(dbPath, 'literature.json');


const SUBJECT_MAPPING = {
    // Accounts
    'Accounting': 'Accounts - Principles of Accounts',
    'Financial Accounting': 'Accounts - Principles of Accounts',
    'accounts-principles-of-accounts': 'Accounts - Principles of Accounts',

    // Agric
    'Agriculture': 'Agricultural Science',
    'Agric': 'Agricultural Science',
    'agricultural-science': 'Agricultural Science',

    // English
    'English': 'English Language',
    'Use of English': 'English Language',
    'english-language': 'English Language',

    // Literature
    'Literature': 'Literature in English',
    'Literature-in-English': 'Literature in English',
    'literature-in-english': 'Literature in English',

    // Religion
    'CRS': 'Christian Religious Knowledge (CRK)',
    'Christian Religious Studies': 'Christian Religious Knowledge (CRK)',
    'CRK': 'Christian Religious Knowledge (CRK)',
    'christian-religious-knowledge-crk': 'Christian Religious Knowledge (CRK)',

    'IRS': 'Islamic Religious Knowledge (IRK)',
    'Islamic Religious Studies': 'Islamic Religious Knowledge (IRK)',
    'IRK': 'Islamic Religious Knowledge (IRK)',
    'islamic-religious-knowledge-irk': 'Islamic Religious Knowledge (IRK)',

    // Art
    'Fine Art': 'Fine Arts',
    'Fine Arts': 'Fine Arts',
    'fine-arts': 'Fine Arts',

    // PHE
    'Physical and Health Education (PHE)': 'Physical and Health Education',
    'PHE': 'Physical and Health Education',
    'physical-and-health-education': 'Physical and Health Education'
};

const readJsonFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
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
        const filter = {};

        if (subject) {
            // Case-insensitive search for subjects to handle URL-lowercase parameters
            const targetSubject = SUBJECT_MAPPING[subject] || subject;
            const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedTarget = targetSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            filter.$or = [
                { subject: new RegExp('^' + escapedTarget + '$', 'i') },
                { subject: new RegExp('^' + escapedSubject + '$', 'i') }
            ];
        }

        if (year) {
            filter.year = Number(year);
        }

        // Query MongoDB with lean() for performance
        let papers = await Paper.find(filter).lean();

        const isAuthenticated = !!req.user;

        if (!isAuthenticated) {
            papers = papers.map(paper => ({
                ...paper,
                questions: (paper.questions || []).slice(0, 10),
                isLimited: true
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

        // Database search using regex (case-insensitive)
        const papers = await Paper.find({
            $or: [
                { 'questions.question': { $regex: query, $options: 'i' } },
                { 'questions.options.A.text': { $regex: query, $options: 'i' } },
                { 'questions.options.B.text': { $regex: query, $options: 'i' } },
                { 'questions.options.C.text': { $regex: query, $options: 'i' } },
                { 'questions.options.D.text': { $regex: query, $options: 'i' } }
            ]
        }).limit(20).lean();

        const results = [];
        papers.forEach(paper => {
            paper.questions.forEach(q => {
                if (q.question.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        ...q,
                        subject: paper.subject,
                        year: paper.year,
                        exam: paper.exam
                    });
                }
            });
        });

        res.json(results.slice(0, 50));
    } catch (error) {
        console.error('Error searching papers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Search past questions by topics
// @route   POST /api/data/search-by-topic
export const searchByTopic = async (req, res) => {
    try {
        const { subject, topic, subTopic } = req.body;

        const targetTopic = topic || subTopic;

        if (!targetTopic) {
            return res.status(400).json({ message: 'topic is required' });
        }

        let targetSubject = subject;
        if (subject) {
            const normalizedSubject = subject.toLowerCase().trim();
            // Case-insensitive lookup in SUBJECT_MAPPING
            const matchedKey = Object.keys(SUBJECT_MAPPING).find(k => k.toLowerCase() === normalizedSubject);
            if (matchedKey) {
                targetSubject = SUBJECT_MAPPING[matchedKey];
            } else if (normalizedSubject.includes('-')) {
                // Fallback for slugs lacking explicit mapping (e.g. 'civic-education' -> 'Civic Education')
                targetSubject = normalizedSubject.replace(/-/g, ' ');
            }
        }

        // Find papers that have questions tagged with this topic (case-insensitive)
        const escapedTerm = targetTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexTerm = new RegExp('^' + escapedTerm + '$', 'i');

        const slugifiedTerm = targetTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const escapedSlugTerm = slugifiedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexSlugTerm = new RegExp('^' + escapedSlugTerm + '$', 'i');

        const filter = {
            $or: [
                { 'questions.topics': regexTerm },
                { 'questions.topics': regexSlugTerm }
            ]
        };

        if (targetSubject) {
            const escapedSubject = targetSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.subject = new RegExp('^' + escapedSubject + '$', 'i');
        }

        const papers = await Paper.find(filter).lean();
        const results = [];

        papers.forEach(paper => {
            paper.questions.forEach(q => {
                const questionTopics = (q.topics || []).map(t => t.toLowerCase());

                // If the question has this exact topic or the slug version (case-insensitive), include it
                const isMatch = questionTopics.includes(targetTopic.toLowerCase()) ||
                    questionTopics.includes(slugifiedTerm);

                if (isMatch) {
                    results.push({
                        ...q,
                        subject: paper.subject,
                        year: paper.year,
                        exam: paper.exam
                    });
                }
            });
        });

        res.json(results.slice(0, 100));
    } catch (error) {
        console.error('Error matching questions:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get study guides
// @route   GET /api/data/guides
export const getGuides = async (req, res) => {
    try {
        // Use MongoDB directly
        const guides = await Guide.find({}).sort({ subject: 1 }).lean();
        res.json(guides);
    } catch (error) {
        console.error('Error fetching guides:', error);
        res.status(500).json({ message: 'Server Error' });
    }
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

        if (answers && typeof answers === 'object') {
            const questionIds = Object.keys(answers);
            // Dynamic query to find papers containing these questions
            const papers = await Paper.find({ 'questions.id': { $in: questionIds } }).lean();
            const allQuestions = papers.flatMap(p => p.questions);

            let verifiedScore = 0;
            questionIds.forEach(qId => {
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
        const leaderboard = await Leaderboard.find().sort({ score: -1, date: -1 }).limit(20);
        res.status(201).json(leaderboard);
    } catch (error) {
        console.error('Error adding leaderboard score:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

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

// @desc    Get JAMB syllabus topics
// @route   GET /api/data/topics
export const getTopics = async (req, res) => {
    try {
        const raw = await readJsonFile(topicsFilePath);
        const asArray = Object.entries(raw).map(([slug, data]) => ({
            slug,
            label: data.label,
            topics: (data.topics || []).map(t => ({
                slug: t.slug,
                label: t.label
            }))
        }));
        res.json(asArray);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
