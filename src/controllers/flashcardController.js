import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const flashcardsFilePath = path.join(dbPath, 'flashcards.json');

const readFlashcards = async () => {
    try {
        const data = await fs.readFile(flashcardsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

const writeFlashcards = async (data) => {
    await fs.mkdir(dbPath, { recursive: true });
    await fs.writeFile(flashcardsFilePath, JSON.stringify(data, null, 2));
};

// @desc    Get all decks for a user
// @route   GET /api/flashcards
export const getDecks = async (req, res) => {
    const userId = req.user.id;
    const allFlashcards = await readFlashcards();
    res.json(allFlashcards[userId] || []);
};

// @desc    Create or update a deck
// @route   POST /api/flashcards
export const saveDeck = async (req, res) => {
    const userId = req.user.id;
    const deck = req.body;

    if (!deck.id || !deck.name) {
        return res.status(400).json({ message: 'Deck ID and Name are required' });
    }

    const allFlashcards = await readFlashcards();
    if (!allFlashcards[userId]) {
        allFlashcards[userId] = [];
    }

    const existingIndex = allFlashcards[userId].findIndex(d => d.id === deck.id);
    if (existingIndex !== -1) {
        allFlashcards[userId][existingIndex] = deck;
    } else {
        allFlashcards[userId].push(deck);
    }

    await writeFlashcards(allFlashcards);
    res.status(201).json(deck);
};

// @desc    Delete a deck
// @route   DELETE /api/flashcards/:id
export const deleteDeck = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const allFlashcards = await readFlashcards();
    if (allFlashcards[userId]) {
        allFlashcards[userId] = allFlashcards[userId].filter(d => d.id !== id);
        await writeFlashcards(allFlashcards);
    }

    res.json({ message: 'Deck deleted' });
};
