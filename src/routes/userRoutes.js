import express from 'express';
import { updateProfile } from '../controllers/userController.js';
import { getProgress, updateProgress, dismissNudge, updateTopicConfidence } from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/progress', protect, getProgress);
router.put('/progress', protect, updateProgress);
router.post('/progress/confidence', protect, updateTopicConfidence);
router.post('/progress/engagement/dismiss', protect, dismissNudge);

export default router;
