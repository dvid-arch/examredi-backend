import User from '../models/User.js';

// Smart filtering helper functions
const calculateRelevanceScore = (activity, now) => {
    let score = 0;
    const age = now - new Date(activity.timestamp);
    const ONE_HOUR = 60 * 60 * 1000;

    // Recency boost (max 50 points)
    if (age < ONE_HOUR) score += 50;
    else if (age < 24 * ONE_HOUR) score += 30;
    else if (age < 7 * 24 * ONE_HOUR) score += 10;

    // Status boost (max 30 points)
    if (activity.status === 'in_progress') score += 30;
    else if (activity.status === 'abandoned') score += 15;

    // Engagement boost (max 20 points)
    score += Math.min((activity.engagementCount || 0) * 5, 20);

    return score;
};

const applyDiversityFilter = (scoredActivities, maxItems) => {
    const result = [];
    const typeCounts = { quiz: 0, guide: 0, game: 0 };

    for (const item of scoredActivities) {
        const type = item.activity.type;
        if (typeCounts[type] < 2 && result.length < maxItems) {
            result.push(item);
            typeCounts[type]++;
        }
        if (result.length >= maxItems) break;
    }

    return result;
};

const getSmartFilteredActivities = (activities, maxItems = 20) => {
    const now = new Date();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    // Filter out dismissed and old activities
    const relevant = activities.filter(a =>
        !a.dismissedAt &&
        (now - new Date(a.timestamp)) < THIRTY_DAYS
    );

    // Score each activity
    const scored = relevant.map(activity => ({
        activity,
        score: calculateRelevanceScore(activity, now)
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Apply diversity filter if maxItems <= 10 (for display purposes)
    if (maxItems <= 10) {
        const diverse = applyDiversityFilter(scored, maxItems);
        return diverse.map(s => s.activity);
    }

    // Otherwise just return top scored items
    return scored.slice(0, maxItems).map(s => s.activity);
};


// @desc    Get user progress (streak and activity)
// @route   GET /api/user/progress?maxItems=6
export const getProgress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('streak recentActivity');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Support smart filtering with maxItems query param
        const maxItems = req.query.maxItems ? parseInt(req.query.maxItems) : 20;
        const activities = maxItems < 20
            ? getSmartFilteredActivities(user.recentActivity || [], maxItems)
            : user.recentActivity || [];

        res.json({
            streak: user.streak?.current || 0,
            streakHistory: user.streak?.history || [],
            recentActivity: activities
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching progress' });
    }
};

// @desc    Update user progress (Activity + Streak Logic)
// @route   PUT /api/user/progress
export const updateProgress = async (req, res) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
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
                const existingActivity = user.recentActivity || [];

                recentActivity.forEach(newAct => {
                    const index = existingActivity.findIndex(a => a.id === newAct.id);
                    if (index !== -1) {
                        existingActivity[index] = { ...existingActivity[index].toObject ? existingActivity[index].toObject() : existingActivity[index], ...newAct, timestamp: now };
                    } else {
                        existingActivity.unshift({ ...newAct, timestamp: now });
                    }
                });

                user.recentActivity = existingActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20); // Keep last 20
            }

            await user.save();

            return res.json({
                streak: user.streak.current,
                streakHistory: user.streak.history,
                recentActivity: user.recentActivity
            });
        } catch (error) {
            if ((error.name === 'VersionError' || error.code === 79) && attempts < maxAttempts - 1) {
                attempts++;
                console.warn(`VersionError encountered on attempt ${attempts}. Retrying progress update for user ${req.user.id}...`);
                // Short delay before retry to let other processes finish
                await new Promise(resolve => setTimeout(resolve, 50 * attempts));
                continue;
            }
            console.error("Update Progress Error:", error);
            return res.status(500).json({ message: 'Error updating progress' });
        }
    }
};

// @desc    Dismiss an activity
// @route   DELETE /api/user/progress/activity/:activityId
export const dismissActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const activity = user.recentActivity.find(a => a.id === activityId);
        if (activity) {
            activity.dismissedAt = new Date();
            await user.save();
        }

        res.json({
            message: 'Activity dismissed',
            recentActivity: user.recentActivity
        });
    } catch (error) {
        console.error("Dismiss Activity Error:", error);
        res.status(500).json({ message: 'Error dismissing activity' });
    }
};

// @desc    Track activity engagement
// @route   POST /api/user/progress/activity/:activityId/engage
export const trackEngagement = async (req, res) => {
    try {
        const { activityId } = req.params;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const activity = user.recentActivity.find(a => a.id === activityId);
        if (activity) {
            activity.engagementCount = (activity.engagementCount || 0) + 1;
            activity.lastEngaged = new Date();
            await user.save();
        }

        res.json({ message: 'Engagement tracked' });
    } catch (error) {
        console.error("Track Engagement Error:", error);
        res.status(500).json({ message: 'Error tracking engagement' });
    }
};
// @desc    Restore a dismissed activity
// @route   PUT /api/user/progress/activity/:activityId/restore
export const restoreActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const activity = user.recentActivity.find(a => a.id === activityId);
        if (activity) {
            activity.dismissedAt = undefined;
        }

        await user.save();

        res.json({
            message: 'Activity restored',
            recentActivity: user.recentActivity
        });
    } catch (error) {
        console.error("Restore Activity Error:", error);
        res.status(500).json({ message: 'Error restoring activity' });
    }
};
