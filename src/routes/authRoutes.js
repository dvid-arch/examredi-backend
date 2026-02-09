import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    refreshAccessToken,
    logoutUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    handlePaymentWebhook,
    generateAccessToken,
    generateRefreshToken
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';
import passport from 'passport';

const router = express.Router();

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!req.user) {
        return res.redirect(`${frontendUrl}/#/login?error=auth_failed`);
    }

    const accessToken = generateAccessToken(req.user.id);
    const refreshToken = generateRefreshToken(req.user.id);

    res.redirect(`${frontendUrl}/#/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});


router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.put('/verifyemail/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/webhook', handlePaymentWebhook);

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