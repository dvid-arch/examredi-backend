import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Paper from '../models/Paper.js';
import Leaderboard from '../models/Leaderboard.js';
import Performance from '../models/Performance.js';
import StudyGuide from '../models/StudyGuide.js';

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

        // --- GUEST LIMITS ---
        // If user is not logged in, limit questions per paper to 10
        const isAuthenticated = !!req.user;

        if (!isAuthenticated) {
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

// @desc    Search past questions by multiple keywords
// @route   POST /api/data/search-batch
export const searchByKeywords = async (req, res) => {
    try {
        const { keywords, subject } = req.body;
        if (!keywords || !Array.isArray(keywords)) {
            return res.status(400).json({ message: 'Keywords array is required' });
        }

        const lowerKeywords = keywords.map(k => k.toLowerCase());
        const allPapers = await readJsonFile(papersFilePath);

        const scoredResults = [];

        // Helper: Escape regex special characters
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Helper: Simple fuzzy matching (Levenshtein distance)
        const levenshteinDistance = (a, b) => {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) matrix[i] = [i];
            for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[b.length][a.length];
        };

        const hasFuzzyMatch = (text, keyword, maxDistance = 2) => {
            const words = text.split(/\s+/);
            return words.some(word => {
                if (Math.abs(word.length - keyword.length) > maxDistance) return false;
                return levenshteinDistance(word, keyword) <= maxDistance;
            });
        };

        allPapers.forEach(paper => {
            if (subject && paper.subject.toLowerCase() !== subject.toLowerCase()) return;

            paper.questions.forEach(q => {
                const questionText = (q.question || '').toLowerCase();
                const optionsText = q.options ? Object.values(q.options).map(o => (o.text || '').toLowerCase()).join(' ') : '';
                const fullText = questionText + ' ' + optionsText;

                // Calculate relevance score
                let score = 0;
                let matchedKeywords = [];

                lowerKeywords.forEach(keyword => {
                    // Exact match (highest score) - use word boundaries for accuracy
                    const exactRegex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
                    if (exactRegex.test(fullText)) {
                        score += 15;
                        matchedKeywords.push(keyword);
                    }
                    // Substring match
                    else if (fullText.includes(keyword)) {
                        score += 5;
                        matchedKeywords.push(keyword + ' (partial)');
                    }
                    // Fuzzy match (edit distance) - only for longer more specific keywords
                    else if (keyword.length > 4 && hasFuzzyMatch(fullText, keyword)) {
                        score += 3;
                        matchedKeywords.push(keyword + ' (fuzzy)');
                    }
                });

                if (score > 0) {
                    scoredResults.push({
                        ...q,
                        subject: paper.subject,
                        year: paper.year,
                        exam: paper.exam,
                        _relevanceScore: score,
                        _matchedKeywords: matchedKeywords
                    });
                }
            });
        });

        // Sort by relevance score (highest first)
        scoredResults.sort((a, b) => b._relevanceScore - a._relevanceScore);

        // Strategy: Use top matches first. If we have enough good matches (score >= 10), returning them is enough.
        const strongMatches = scoredResults.filter(r => r._relevanceScore >= 10);

        if (strongMatches.length >= 20) {
            console.log(`Found ${strongMatches.length} strong matches for ${subject}. Returning top 100.`);
            return res.json(scoredResults.slice(0, 100));
        }

        // If we have few strong matches, supplement with random subject questions to ensure a good test size
        console.log(`Only ${strongMatches.length} strong matches found. Supplementing...`);

        const fallbackCount = Math.max(0, 30 - scoredResults.length);
        if (fallbackCount > 0) {
            const subjectQuestions = [];
            allPapers.forEach(paper => {
                if (subject && paper.subject.toLowerCase() === subject.toLowerCase()) {
                    paper.questions.forEach(q => {
                        // Avoid duplicates
                        if (!scoredResults.find(r => r.id === q.id)) {
                            subjectQuestions.push({
                                ...q,
                                subject: paper.subject,
                                year: paper.year,
                                exam: paper.exam,
                                _relevanceScore: 0
                            });
                        }
                    });
                }
            });

            const shuffled = subjectQuestions.sort(() => Math.random() - 0.5);
            const fallbackResults = shuffled.slice(0, fallbackCount);

            // Combine scored results first, then fallback
            const finalResults = [...scoredResults, ...fallbackResults];
            // Deduplicate
            const unique = Array.from(new Map(finalResults.map(q => [q.id, q])).values());

            console.log(`Returning ${unique.length} questions (${scoredResults.length} scored + ${unique.length - scoredResults.length} fallback)`);
            return res.json(unique.slice(0, 100));
        }

        res.json(scoredResults.slice(0, 100));
    } catch (error) {
        console.error('Error enhanced searching papers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get study guides
// @route   GET /api/data/guides
export const getGuides = async (req, res) => {
    try {
        let guides = await StudyGuide.find({}).sort({ createdAt: -1 });

        // Migration logic: If DB is empty, sync from JSON
        if (guides.length === 0) {
            console.log("StudyGuide collection empty. Migrating from guides.json...");
            const jsonGuides = await readJsonFile(guidesFilePath);
            if (jsonGuides.length > 0) {
                // Ensure IDs are strings and clean up for Mongoose
                const sanitized = jsonGuides.map(g => ({
                    ...g,
                    id: g.id?.toString() || new mongoose.Types.ObjectId().toString()
                }));
                await StudyGuide.insertMany(sanitized);
                guides = await StudyGuide.find({}).sort({ createdAt: -1 });
            }
        }
        res.json(guides);
    } catch (error) {
        console.error('Error fetching guides from DB:', error);
        // Fallback to JSON if DB fails during migration
        const fallback = await readJsonFile(guidesFilePath);
        res.json(fallback);
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

