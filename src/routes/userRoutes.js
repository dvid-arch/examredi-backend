import express from 'express';
import { updateProfile } from '../controllers/userController.js';
import { getProgress, updateProgress, dismissActivity, trackEngagement } from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/progress', protect, getProgress);
router.put('/progress', protect, updateProgress);
router.delete('/progress/activity/:activityId', protect, dismissActivity);
router.post('/progress/activity/:activityId/engage', protect, trackEngagement);

export default router;
