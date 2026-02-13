import User from '../models/User.js';
import StudyGuide from '../models/StudyGuide.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const papersFilePath = path.join(dbPath, 'papers.json');
const guidesFilePath = path.join(dbPath, 'guides.json');

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
        const papers = await readJsonFile(papersFilePath);
        const newPaper = { ...req.body, id: Date.now().toString() };
        papers.push(newPaper);
        await fs.writeFile(papersFilePath, JSON.stringify(papers, null, 2));
        res.status(201).json(newPaper);
    } catch (error) {
        res.status(500).json({ message: 'Error adding paper' });
    }
};

// @desc    Edit a paper
// @route   PUT /api/admin/papers/:id
export const editPaper = async (req, res) => {
    try {
        const { id } = req.params;
        const papers = await readJsonFile(papersFilePath);
        const paperIndex = papers.findIndex(p => p.id === id);
        if (paperIndex === -1) {
            return res.status(404).json({ message: 'Paper not found' });
        }
        papers[paperIndex] = { ...papers[paperIndex], ...req.body };
        await fs.writeFile(papersFilePath, JSON.stringify(papers, null, 2));
        res.json(papers[paperIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Error editing paper' });
    }
};

// @desc    Add a new guide
// @route   POST /api/admin/guides
export const addGuide = async (req, res) => {
    try {
        const newGuide = await StudyGuide.create({
            ...req.body,
            id: req.body.id || Date.now().toString()
        });
        res.status(201).json(newGuide);
    } catch (error) {
        console.error('Error adding guide to DB:', error);
        res.status(500).json({ message: 'Error adding guide' });
    }
};

// @desc    Edit a guide
// @route   PUT /api/admin/guides/:id
export const editGuide = async (req, res) => {
    try {
        const { id } = req.params;
        const guide = await StudyGuide.findOneAndUpdate({ id }, req.body, { new: true });
        if (!guide) {
            return res.status(404).json({ message: 'Guide not found' });
        }
        res.json(guide);
    } catch (error) {
        console.error('Error editing guide in DB:', error);
        res.status(500).json({ message: 'Error editing guide' });
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
export const getAdminStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const papers = await readJsonFile(papersFilePath);
        const guidesCount = await StudyGuide.countDocuments();

        const totalQuestions = papers.reduce((acc, paper) => acc + (paper.questions?.length || 0), 0);

        res.json({
            users: userCount,
            papers: papers.length,
            questions: totalQuestions,
            guides: guidesCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve stats' });
    }
};


// @desc    Delete a past paper
// @route   DELETE /api/admin/papers/:id
export const deletePaper = async (req, res) => {
    const { id } = req.params;
    const papers = await readJsonFile(papersFilePath);
    const updatedPapers = papers.filter(p => p.id !== id);

    if (papers.length === updatedPapers.length) {
        return res.status(404).json({ message: 'Paper not found' });
    }

    try {
        await fs.writeFile(papersFilePath, JSON.stringify(updatedPapers, null, 2));
        res.status(200).json({ message: 'Paper deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error writing to database' });
    }
};

// @desc    Delete a study guide
// @route   DELETE /api/admin/guides/:id
export const deleteGuide = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await StudyGuide.deleteOne({ id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Guide not found' });
        }
        res.status(200).json({ message: 'Guide deleted successfully' });
    } catch (error) {
        console.error('Error deleting guide from DB:', error);
        res.status(500).json({ message: 'Error deleting guide' });
    }
};
