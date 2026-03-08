import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user from MongoDB, exclude password
            req.user = await User.findById(decoded.id).select('-password');
            req.sessionId = decoded.sessionId;

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Verify sessionId is still active
            const isSessionActive = req.user.activeSessions.some(s => s.sessionId === req.sessionId);
            if (!isSessionActive) {
                return res.status(401).json({ message: 'Session expired or logged in elsewhere' });
            }

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            console.log(`[AuthDebug] User ${decoded.id} loaded. Role: ${req.user?.role}, Sub: ${req.user?.subscription}`);
            next();
        } catch (error) {
            // Even if token fails, allowed as optional
            console.error('Optional Auth Error:', error);
            next();
        }
    } else {
        console.log(`[AuthDebug] No auth header found. User is anonymous.`);
        next();
    }
};
