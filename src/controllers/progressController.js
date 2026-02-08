import User from '../models/User.js';

// @desc    Get user progress (streak and activity)
// @route   GET /api/user/progress
export const getProgress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('streak recentActivity');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            streak: user.streak?.current || 0,
            recentActivity: user.recentActivity || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching progress' });
    }
};

// @desc    Update user progress (Activity + Streak Logic)
// @route   PUT /api/user/progress
export const updateProgress = async (req, res) => {
    try {
        const { streak: clientStreak, recentActivity } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // --- SERVER-SIDE STREAK LOGIC ---
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDate = user.streak?.lastDate ? new Date(user.streak.lastDate) : null;

        let newStreak = user.streak?.current || 0;
        let streakHistory = user.streak?.history || [];

        if (!lastDate) {
            newStreak = 1;
        } else {
            const lastActiveDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
            const diffDays = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                newStreak += 1;
            } else if (diffDays > 1) {
                // Missed a day
                newStreak = 1;
            }
            // If diffDays === 0, it's the same day, streak doesn't change
        }

        // Add today to history if not exists
        if (!streakHistory.includes(todayStr)) {
            streakHistory.push(todayStr);
        }

        user.streak = {
            current: newStreak,
            longest: Math.max(newStreak, user.streak?.longest || 0),
            lastDate: now,
            history: streakHistory
        };

        if (recentActivity && Array.isArray(recentActivity)) {
            // Merge existing activity with new activity to avoid data loss
            // newActivity should be an array of updated items
            const existingActivity = user.recentActivity || [];

            recentActivity.forEach(newAct => {
                const index = existingActivity.findIndex(a => a.id === newAct.id);
                if (index !== -1) {
                    existingActivity[index] = { ...existingActivity[index].toObject(), ...newAct, timestamp: now };
                } else {
                    existingActivity.unshift({ ...newAct, timestamp: now });
                }
            });

            user.recentActivity = existingActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20); // Keep last 20
        }

        await user.save();

        res.json({
            streak: user.streak.current,
            streakHistory: user.streak.history,
            recentActivity: user.recentActivity
        });
    } catch (error) {
        console.error("Update Progress Error:", error);
        res.status(500).json({ message: 'Error updating progress' });
    }
};
