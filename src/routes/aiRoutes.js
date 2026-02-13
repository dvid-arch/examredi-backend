import express from 'express';
import { handleAiChat, handleGenerateGuide, handleResearch, handleGetTopicKeywords, createConversation, getConversations, getConversation, deleteConversation } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI routes should be protected to manage credits and usage
router.post('/chat', protect, handleAiChat);
router.post('/generate-guide', protect, handleGenerateGuide);
router.post('/research', protect, handleResearch);
router.post('/topic-keywords', protect, handleGetTopicKeywords);

// Conversation management routes
router.post('/conversations/new', protect, createConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:conversationId', protect, getConversation);
router.delete('/conversations/:conversationId', protect, deleteConversation);

export default router;
