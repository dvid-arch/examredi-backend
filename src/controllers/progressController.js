import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const progressFilePath = path.join(dbPath, 'progress.json');

const readProgress = async () => {
    try {
        const data = await fs.readFile(progressFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

const writeProgress = async (data) => {
    await fs.mkdir(dbPath, { recursive: true });
    await fs.writeFile(progressFilePath, JSON.stringify(data, null, 2));
};

// @desc    Get user progress (streak and activity)
// @route   GET /api/user/progress
export const getProgress = async (req, res) => {
    const userId = req.user.id;
    const allProgress = await readProgress();
    const userProgress = allProgress[userId] || { streak: 0, recentActivity: [] };
    res.json(userProgress);
};

// @desc    Update user progress
// @route   PUT /api/user/progress
export const updateProgress = async (req, res) => {
    const userId = req.user.id;
    const { streak, recentActivity } = req.body;

    const allProgress = await readProgress();
    allProgress[userId] = { streak: streak || 0, recentActivity: recentActivity || [] };

    await writeProgress(allProgress);
    res.json(allProgress[userId]);
};
