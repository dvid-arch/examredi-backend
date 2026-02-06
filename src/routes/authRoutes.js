import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    refreshAccessToken,
    logoutUser,
    forgotPassword,
    resetPassword,
    verifyEmail
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.put('/verifyemail/:token', verifyEmail);

router.get('/fix-db-index', async (req, res) => {
    try {
        const collection = req.app.locals.db ? req.app.locals.db.collection('users') : (await import('mongoose')).connection.collection('users');
        if (!collection) return res.status(500).json({ msg: 'No DB connection' });

        try {
            await collection.dropIndex('username_1');
            res.json({ msg: 'Index username_1 dropped successfully' });
        } catch (e) {
            res.json({ msg: 'Index might not exist or verify error', error: e.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;