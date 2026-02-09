import express from 'express';
import { handleAiChat, handleGenerateGuide, handleResearch, handleGetTopicKeywords } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI routes should be protected to manage credits and usage
router.post('/chat', protect, handleAiChat);
router.post('/generate-guide', protect, handleGenerateGuide);
router.post('/research', protect, handleResearch);
router.post('/topic-keywords', protect, handleGetTopicKeywords);

export default router;
