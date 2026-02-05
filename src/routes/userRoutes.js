import express from 'express';
import { updateProfile } from '../controllers/userController.js';
import { getProgress, updateProgress } from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/progress', protect, getProgress);
router.put('/progress', protect, updateProgress);

export default router;
