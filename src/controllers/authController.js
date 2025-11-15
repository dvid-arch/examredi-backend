import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const usersFilePath = path.join(dbPath, 'users.json');

const readUsers = async () => {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist, return an empty array
        return [];
    }
};

const writeUsers = async (users) => {
    await fs.mkdir(dbPath, { recursive: true });
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
};

const generateAccessToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    const users = await readUsers();
    const userExists = users.find(u => u.email === email);

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
        id: new Date().getTime().toString(),
        name,
        email,
        passwordHash,
        subscription: 'free',
        role: 'user',
        aiCredits: 0,
        dailyMessageCount: 0,
        lastMessageDate: getTodayDateString(),
        refreshToken: ''
    };

    const accessToken = generateAccessToken(newUser.id, newUser.email);
    const refreshToken = generateRefreshToken(newUser.id);
    newUser.refreshToken = refreshToken;

    users.push(newUser);
    await writeUsers(users);

    res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        subscription: newUser.subscription,
        role: newUser.role,
        accessToken,
        refreshToken,
    });
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.email === email.toLowerCase());
    
    if (userIndex === -1) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = users[userIndex];

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id);

        users[userIndex].refreshToken = refreshToken;
        await writeUsers(users);

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            subscription: user.subscription,
            role: user.role,
            aiCredits: user.aiCredits,
            dailyMessageCount: user.dailyMessageCount,
            lastMessageDate: user.lastMessageDate,
            accessToken,
            refreshToken
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
export const refreshAccessToken = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const users = await readUsers();
        const userIndex = users.findIndex(u => u.id === decoded.id && u.refreshToken === token);
        
        if (userIndex === -1) {
            return res.status(403).json({ message: 'Invalid or revoked refresh token' });
        }
        
        const user = users[userIndex];
        
        // Token Rotation: Generate new access and refresh tokens
        const newAccessToken = generateAccessToken(user.id, user.email);
        const newRefreshToken = generateRefreshToken(user.id);
        
        users[userIndex].refreshToken = newRefreshToken;
        await writeUsers(users);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        console.error("Refresh token error:", error.message);
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logoutUser = async (req, res) => {
    // This is a protected route, so req.user is available
    try {
        const users = await readUsers();
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex !== -1) {
            // Invalidate the refresh token
            users[userIndex].refreshToken = '';
            await writeUsers(users);
        }
        
        res.status(204).send(); // Success, No Content
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};


// @desc    Get user profile data
// @route   GET /api/auth/profile
export const getUserProfile = async (req, res) => {
    const users = await readUsers();
    const user = users.find(u => u.id === req.user?.id);

    if (user) {
         // Reset daily message count if the date has changed
        const today = getTodayDateString();
        if (user.lastMessageDate !== today) {
            user.dailyMessageCount = 0;
            user.lastMessageDate = today;
            await writeUsers(users);
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            subscription: user.subscription,
            role: user.role,
            aiCredits: user.aiCredits,
            dailyMessageCount: user.dailyMessageCount,
            lastMessageDate: user.lastMessageDate
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};