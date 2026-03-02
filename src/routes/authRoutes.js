import express from 'express';
import {
    getUserProfile,
    handlePaymentWebhook
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
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