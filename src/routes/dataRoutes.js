import express from 'express';
import { getPapers, getGuides, getLeaderboard, addLeaderboardScore, getPerformance, addPerformanceResult, getLiterature, searchPapers } from '../controllers/dataController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/papers', getPapers);
router.get('/guides', getGuides);
router.get('/leaderboard', getLeaderboard);
router.get('/literature', getLiterature);
router.get('/search', searchPapers);

// Protected routes
router.post('/leaderboard', protect, addLeaderboardScore);
router.get('/performance', protect, getPerformance);
router.post('/performance', protect, addPerformanceResult);

export default router;
