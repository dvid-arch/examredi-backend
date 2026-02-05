import express from 'express';
import { getDecks, saveDeck, deleteDeck } from '../controllers/flashcardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All flashcard routes require authentication

router.get('/', getDecks);
router.post('/', saveDeck);
router.delete('/:id', deleteDeck);

export default router;
