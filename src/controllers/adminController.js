import User from '../models/User.js';
import Paper from '../models/Paper.js';
import Guide from '../models/Guide.js';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const papersFilePath = path.join(dbPath, 'all_papers.json');
const guidesFilePath = path.join(dbPath, 'guide.json');
const topicsFilePath = path.join(dbPath, 'topics.json');

// Helper to sync JSON backups (keeping user's request for parity)
const syncBackups = async () => {
    try {
        const papers = await Paper.find({}).lean();
        const guides = await Guide.find({}).lean();

        if (papers.length > 0) {
            await fs.writeFile(papersFilePath, JSON.stringify(papers, null, 2));
        }
        if (guides.length > 0) {
            await fs.writeFile(guidesFilePath, JSON.stringify(guides, null, 2));
        }
        console.log(`[Backup Sync] Synced ${papers.length} papers and ${guides.length} guides.`);
    } catch (error) {
        console.error('[Backup Sync Error]:', error.message);
    }
};

const readJsonFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[Error] Failed to read file ${filePath}:`, error.message);
        return [];
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc    Add a new user
// @route   POST /api/admin/users
export const addUser = async (req, res) => {
    try {
        const { name, email, password, role = 'user', subscription = 'free' } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            subscription
        });

        const safeUser = user.toObject();
        delete safeUser.password;
        res.status(201).json(safeUser);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
};

// @desc    Edit a user
// @route   PUT /api/admin/users/:id
export const editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, subscription } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (subscription) user.subscription = subscription;

        await user.save();

        const safeUser = user.toObject();
        delete safeUser.password;
        res.json(safeUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.deleteOne();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// @desc    Update user subscription
// @route   PUT /api/admin/users/:id/subscription
export const updateUserSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { subscription } = req.body;

        if (!['free', 'pro'].includes(subscription)) {
            return res.status(400).json({ message: 'Invalid subscription status' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot change an admin\'s subscription' });
        }

        user.subscription = subscription;
        await user.save();

        const safeUser = user.toObject();
        delete safeUser.password;
        res.json(safeUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating subscription' });
    }
};

// @desc    Add a new paper
// @route   POST /api/admin/papers
export const addPaper = async (req, res) => {
    try {
        const paper = await Paper.create(req.body);
        await syncBackups();
        res.status(201).json(paper);
    } catch (error) {
        console.error('Error adding paper:', error);
        res.status(500).json({ message: error.message || 'Error adding paper' });
    }
};

// @desc    Edit a paper
// @route   PUT /api/admin/papers/:id
export const editPaper = async (req, res) => {
    try {
        const { id } = req.params;
        // Use subject/year or ID if available. React app uses Paper.id usually?
        // Actually, the frontend passed p.id which we just populated with Date.now().toString() in previous version.
        // Mongoose uses _id but these papers have an 'id' field too.
        const paper = await Paper.findOneAndUpdate(
            { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { id: id }] },
            req.body,
            { new: true }
        );

        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        await syncBackups();
        res.json(paper);
    } catch (error) {
        console.error('Error editing paper:', error);
        res.status(500).json({ message: error.message || 'Error editing paper' });
    }
};

// @desc    Add a new guide
// @route   POST /api/admin/guides
export const addGuide = async (req, res) => {
    try {
        const guide = await Guide.create(req.body);
        await syncBackups();
        res.status(201).json(guide);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error adding guide' });
    }
};

// @desc    Edit a guide
// @route   PUT /api/admin/guides/:id
export const editGuide = async (req, res) => {
    try {
        const { id } = req.params;
        // Case-insensitive lookup for the ID slug
        const guide = await Guide.findOneAndUpdate(
            { id: { $regex: new RegExp('^' + id + '$', 'i') } },
            req.body,
            { new: true }
        );

        if (!guide) {
            return res.status(404).json({ message: `Guide not found (${id})` });
        }
        await syncBackups();
        res.json(guide);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error editing guide' });
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
export const getAdminStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const paperCount = await Paper.countDocuments();
        const guideCount = await Guide.countDocuments();

        // Calculate total questions across all papers
        const stats = await Paper.aggregate([
            { $project: { questionCount: { $size: "$questions" } } },
            { $group: { _id: null, totalQuestions: { $sum: "$questionCount" } } }
        ]);

        const totalQuestions = stats.length > 0 ? stats[0].totalQuestions : 0;

        res.json({
            users: userCount,
            papers: paperCount,
            questions: totalQuestions,
            guides: guideCount
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Failed to retrieve stats' });
    }
};


// @desc    Delete a past paper
// @route   DELETE /api/admin/papers/:id
export const deletePaper = async (req, res) => {
    try {
        const { id } = req.params;
        const paper = await Paper.findOneAndDelete({ $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { id: id }] });

        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        await syncBackups();
        res.status(200).json({ message: 'Paper deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting paper' });
    }
};

// @desc    Delete a study guide
// @route   DELETE /api/admin/guides/:id
export const deleteGuide = async (req, res) => {
    try {
        const { id } = req.params;
        const guide = await Guide.findOneAndDelete({ id: { $regex: new RegExp('^' + id + '$', 'i') } });

        if (!guide) {
            return res.status(404).json({ message: `Guide not found (${id})` });
        }

        await syncBackups();
        res.status(200).json({ message: 'Guide deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting guide' });
    }
};
// @desc    Get all topics
// @route   GET /api/admin/topics
export const getTopics = async (req, res) => {
    try {
        console.log(`[Admin] Reading topics from: ${topicsFilePath}`);
        const data = await fs.readFile(topicsFilePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('[Admin] Error reading topics:', error);
        res.status(500).json({
            message: 'Error reading topics [CODE_V4]',
            error: error.message,
            path: topicsFilePath
        });
    }
};

// @desc    Export questions by topic
// @route   GET /api/admin/export-questions/:topicSlug
export const exportQuestionsByTopic = async (req, res) => {
    try {
        const { topicSlug } = req.params;
        const { label } = req.query;
        const timestamp = new Date().toISOString();

        console.log(`\n[${timestamp}] ========== EXPORT START ==========`);
        console.log(`Target Slug: "${topicSlug}"`);
        if (label) console.log(`Target Label: "${label}"`);

        // Create regexes for both slug and label (mirrors searchByTopic logic)
        const terms = [topicSlug];
        if (label) terms.push(label);

        const filterRegexes = terms.map(term => {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp('^' + escaped + '$', 'i');
        });

        console.log(`Running dual-match aggregation pipeline...`);

        const questions = await Paper.aggregate([
            { $match: { "questions.topics": { $in: filterRegexes } } },
            { $unwind: "$questions" },
            { $match: { "questions.topics": { $in: filterRegexes } } },
            {
                $project: {
                    _id: 0,
                    id: "$questions.id",
                    question: "$questions.question",
                    options: "$questions.options",
                    answer: "$questions.answer",
                    explanation: "$questions.explanation",
                    image: "$questions.image",
                    topics: "$questions.topics",
                    subject: 1,
                    year: 1,
                    exam: 1,
                    paperId: "$id"
                }
            }
        ]);

        console.log(`[EXPORT SUCCESS] Found ${questions.length} questions.`);
        console.log(`[${timestamp}] ========== EXPORT END ========== \n`);

        res.json(questions);
    } catch (error) {
        console.error(`[EXPORT CRITICAL ERROR]:`, error);
        res.status(500).json({
            message: 'Export failed at the database level.',
            error: error.message
        });
    }
};

// @desc    Update question tags (topics)
// @route   PUT /api/admin/papers/:paperId/questions/:questionId/tags
export const updateQuestionTags = async (req, res) => {
    try {
        const { paperId, questionId } = req.params;
        const { topics } = req.body;

        console.log(`[Admin] Updating tags for Paper: ${paperId}, Question: ${questionId}`);
        console.log(`[Admin] New Topics:`, topics);

        // Standard database lookup (either MongoDB _id or custom id slug)
        const paper = await Paper.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(paperId) ? paperId : null },
                { id: paperId }
            ]
        });

        if (!paper) {
            console.warn(`[Admin] Paper NOT FOUND in database for ID: ${paperId}. Full params:`, req.params);
            return res.status(404).json({
                message: `Paper not found (${paperId}). Ensure the database is seeded by redeploying to Render.`
            });
        }

        const questionIndex = paper.questions.findIndex(q => q.id === questionId);
        if (questionIndex === -1) {
            console.warn(`[Admin] Question NOT FOUND for ID: ${questionId} in paper: ${paperId}`);
            return res.status(404).json({ message: 'Question not found' });
        }

        paper.questions[questionIndex].topics = topics;
        await paper.save();

        // Sync to JSON backup for safety
        await syncBackups();

        res.json(paper.questions[questionIndex]);
    } catch (error) {
        console.error('Error updating question tags:', error);
        res.status(500).json({ message: error.message || 'Error updating tags' });
    }
};

// @desc    Edit a single question within a paper
// @route   PUT /api/admin/papers/:paperId/questions/:questionId
export const editQuestion = async (req, res) => {
    try {
        const { paperId, questionId } = req.params;
        const { question, options, answer, explanation, image } = req.body;

        console.log(`[Admin] Editing Question: ${questionId} in Paper: ${paperId}`);

        // Find the paper
        const paper = await Paper.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(paperId) ? paperId : null },
                { id: paperId }
            ]
        });

        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        // Find the question index
        const questionIndex = paper.questions.findIndex(q => q.id === questionId);
        if (questionIndex === -1) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Update the question fields
        if (question !== undefined) paper.questions[questionIndex].question = question;
        if (options !== undefined) paper.questions[questionIndex].options = options;
        if (answer !== undefined) paper.questions[questionIndex].answer = answer;
        if (explanation !== undefined) paper.questions[questionIndex].explanation = explanation;
        if (image !== undefined) paper.questions[questionIndex].image = image;

        // Save the paper
        await paper.save();

        // Sync backups
        await syncBackups();

        res.json(paper.questions[questionIndex]);
    } catch (error) {
        console.error('Error editing question:', error);
        res.status(500).json({ message: error.message || 'Error editing question' });
    }
};
