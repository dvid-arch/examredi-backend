import User from '../models/User.js';
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

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
export const getAdminStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const papers = await readJsonFile(papersFilePath);
        const guides = await readJsonFile(guidesFilePath);

        const totalQuestions = papers.reduce((acc, paper) => acc + (paper.questions?.length || 0), 0);

        res.json({
            users: userCount,
            papers: papers.length,
            questions: totalQuestions,
            guides: guides.length
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
    const guides = await readJsonFile(guidesFilePath);
    const updatedGuides = guides.filter(g => g.id !== id);

    if (guides.length === updatedGuides.length) {
        return res.status(404).json({ message: 'Guide not found' });
    }

    try {
        await fs.writeFile(guidesFilePath, JSON.stringify(updatedGuides, null, 2));
        res.status(200).json({ message: 'Guide deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error writing to database' });
    }
};
