import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper: Generate Access Token (Short-lived)
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Helper: Generate Refresh Token (Long-lived)
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user (password hashing handled by pre-save hook in model)
        const user = await User.create({
            name,
            email,
            password,
            subscription: 'free',
            role: 'user',
            studyPlan: { // Initialize with defaults
                targetScore: 250,
                weakSubjects: [],
                dailyGoal: 10
            }
        });

        if (user) {
            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                role: user.role,
                accessToken,
                refreshToken,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                role: user.role,
                // Add AI credits or other logic here later if needed
                accessToken,
                refreshToken
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
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

        // Find user by ID just to verify existence
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(403).json({ message: 'Invalid token: User not found' });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id); // Rotate refresh token for security

        res.json({
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error("Refresh token error:", error.message);
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logoutUser = async (req, res) => {
    // Stateless JWTs typically handled on client side by forgetting token.
    // Ideally, add token to a blacklist or DB of revoked tokens.
    // For now, simply return success.
    res.status(204).send();
};


// @desc    Get user profile data
// @route   GET /api/auth/profile
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};