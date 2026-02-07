import express from 'express';
import { getPapers, getGuides, getLeaderboard, addLeaderboardScore, getPerformance, addPerformanceResult, getLiterature, searchPapers } from '../controllers/dataController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes with optional auth (for feature gating)
router.get('/papers', optionalProtect, getPapers);
router.get('/guides', optionalProtect, getGuides);
router.get('/leaderboard', optionalProtect, getLeaderboard);
router.get('/literature', optionalProtect, getLiterature);
router.get('/search', optionalProtect, searchPapers);

// Protected routes
router.post('/leaderboard', protect, addLeaderboardScore);
router.get('/performance', protect, getPerformance);
router.post('/performance', protect, addPerformanceResult);

export default router;
