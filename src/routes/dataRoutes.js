import express from 'express';
import { getPapers, getGuides, getTopics, getLeaderboard, addLeaderboardScore, getPerformance, addPerformanceResult, getLiterature, searchPapers, searchByTopic } from '../controllers/dataController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes with optional auth (for feature gating)
router.get('/papers', optionalProtect, getPapers);
router.get('/guides', optionalProtect, getGuides);
router.get('/topics', optionalProtect, getTopics);
router.get('/leaderboard', optionalProtect, getLeaderboard);
router.get('/literature', optionalProtect, getLiterature);
router.get('/search', optionalProtect, searchPapers);
router.post('/search-by-topic', optionalProtect, searchByTopic);

// Protected routes
router.post('/leaderboard', protect, addLeaderboardScore);
router.get('/performance', protect, getPerformance);
router.post('/performance', protect, addPerformanceResult);

export default router;
