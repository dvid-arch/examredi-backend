import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db');
const usersFilePath = path.join(dbPath, 'users.json');

const readUsers = async () => {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) { return []; }
};

const writeUsers = async (users) => {
    await fs.mkdir(dbPath, { recursive: true });
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
};

// @desc    Update user profile
// @route   PUT /api/user/profile
export const updateProfile = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    users[userIndex].name = name;
    await writeUsers(users);

    const { passwordHash, refreshToken, ...safeUser } = users[userIndex];
    res.json(safeUser);
};
