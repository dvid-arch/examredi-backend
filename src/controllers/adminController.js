// @desc    Add a new user
// @route   POST /api/admin/users
export const addUser = async (req, res) => {
    const { name, email, password, role = 'user', subscription = 'free' } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const users = await readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const bcrypt = (await import('bcryptjs')).default;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        passwordHash,
        role,
        subscription,
        aiCredits: subscription === 'pro' ? 10 : 0,
        dailyMessageCount: 0,
        lastMessageDate: new Date().toISOString().split('T')[0],
        refreshToken: ''
    };
    users.push(newUser);
    await writeUsers(users);
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
};

// @desc    Edit a user
// @route   PUT /api/admin/users/:id
export const editUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, subscription } = req.body;
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    if (role) users[userIndex].role = role;
    if (subscription) users[userIndex].subscription = subscription;
    await writeUsers(users);
    const { passwordHash, ...safeUser } = users[userIndex];
    res.json(safeUser);
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    users.splice(userIndex, 1);
    await writeUsers(users);
    res.status(204).send();
};

// @desc    Add a new paper
// @route   POST /api/admin/papers
export const addPaper = async (req, res) => {
    const papers = await readJsonFile(papersFilePath);
    const newPaper = { ...req.body, id: Date.now().toString() };
    papers.push(newPaper);
    await fs.writeFile(papersFilePath, JSON.stringify(papers, null, 2));
    res.status(201).json(newPaper);
};

// @desc    Edit a paper
// @route   PUT /api/admin/papers/:id
export const editPaper = async (req, res) => {
    const { id } = req.params;
    const papers = await readJsonFile(papersFilePath);
    const paperIndex = papers.findIndex(p => p.id === id);
    if (paperIndex === -1) {
        return res.status(404).json({ message: 'Paper not found' });
    }
    papers[paperIndex] = { ...papers[paperIndex], ...req.body };
    await fs.writeFile(papersFilePath, JSON.stringify(papers, null, 2));
    res.json(papers[paperIndex]);
};

// @desc    Add a new guide
// @route   POST /api/admin/guides
export const addGuide = async (req, res) => {
    const guides = await readJsonFile(guidesFilePath);
    const newGuide = { ...req.body, id: Date.now().toString() };
    guides.push(newGuide);
    await fs.writeFile(guidesFilePath, JSON.stringify(guides, null, 2));
    res.status(201).json(newGuide);
};

// @desc    Edit a guide
// @route   PUT /api/admin/guides/:id
export const editGuide = async (req, res) => {
    const { id } = req.params;
    const guides = await readJsonFile(guidesFilePath);
    const guideIndex = guides.findIndex(g => g.id === id);
    if (guideIndex === -1) {
        return res.status(404).json({ message: 'Guide not found' });
    }
    guides[guideIndex] = { ...guides[guideIndex], ...req.body };
    await fs.writeFile(guidesFilePath, JSON.stringify(guides, null, 2));
    res.json(guides[guideIndex]);
};
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const usersFilePath = path.join(dbPath, 'users.json');
const papersFilePath = path.join(dbPath, 'papers.json');
const guidesFilePath = path.join(dbPath, 'guides.json');

const readUsers = async () => {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) { return []; }
};

const writeUsers = async (users) => {
    await fs.mkdir(dbPath, { recursive: true });
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
};

const readJsonFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getUsers = async (req, res) => {
    const users = await readUsers();
    // Don't send password hashes to the client
    const safeUsers = users.map(({ passwordHash, ...user }) => user);
    res.json(safeUsers);
};

// @desc    Update user subscription
// @route   PUT /api/admin/users/:id/subscription
export const updateUserSubscription = async (req, res) => {
    const { id } = req.params;
    const { subscription } = req.body;

    if (!['free', 'pro'].includes(subscription)) {
        return res.status(400).json({ message: 'Invalid subscription status' });
    }

    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // Admins cannot have their subscription changed
    if(users[userIndex].role === 'admin') {
         return res.status(403).json({ message: 'Cannot change an admin\'s subscription' });
    }

    users[userIndex].subscription = subscription;
    
    // Give credits when upgrading to pro
    if(subscription === 'pro') {
        users[userIndex].aiCredits = 10;
    } else {
        users[userIndex].aiCredits = 0;
    }

    await writeUsers(users);

    const { passwordHash, ...updatedUser } = users[userIndex];
    res.json(updatedUser);
};


// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
export const getAdminStats = async (req, res) => {
    try {
        const users = await readUsers();
        const papers = await readJsonFile(papersFilePath);
        const guides = await readJsonFile(guidesFilePath);

        const totalQuestions = papers.reduce((acc, paper) => acc + paper.questions.length, 0);

        res.json({
            users: users.length,
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
