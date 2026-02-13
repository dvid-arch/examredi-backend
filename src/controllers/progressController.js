import User from '../models/User.js';
import { normalizeSubjects } from '../utils/subjects.js';

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
            recentActivity: user.recentActivity || [],
            engagement: user.engagement || { dismissedNudges: [], unlockedNudges: [] }
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
                    // Normalize the subject name(s)
                    const normalizedSubject = normalizeSubjects(newAct.subject);
                    const activityWithNormalizedSubject = { ...newAct, subject: normalizedSubject };

                    if (index !== -1) {
                        existingActivity[index] = { ...existingActivity[index].toObject ? existingActivity[index].toObject() : existingActivity[index], ...activityWithNormalizedSubject, timestamp: now };
                    } else {
                        existingActivity.unshift({ ...activityWithNormalizedSubject, timestamp: now });
                    }
                });

                user.recentActivity = existingActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50); // Keep last 50

                // --- SERVER-SIDE NUDGE TRIGGERS ---
                if (!user.engagement) user.engagement = { dismissedNudges: [], unlockedNudges: [] };

                // Example: Unlock 100k Challenge nudge for high performers
                recentActivity.forEach(act => {
                    if (act.score && act.maxScore && (act.score / act.maxScore) >= 0.85) {
                        if (!user.engagement.unlockedNudges.includes('utme-challenge-100k')) {
                            user.engagement.unlockedNudges.push('utme-challenge-100k');
                        }
                    }
                });

                // Universal: Unlock Pro Nudge for all free users after activity
                if (user.subscription === 'free' && !user.engagement.unlockedNudges.includes('pro-success-stat')) {
                    user.engagement.unlockedNudges.push('pro-success-stat');
                }
            }

            await user.save();

            return res.json({
                streak: user.streak.current,
                streakHistory: user.streak.history,
                recentActivity: user.recentActivity,
                engagement: user.engagement
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

// @desc    Dismiss an engagement nudge
// @route   POST /api/user/progress/engagement/dismiss
export const dismissNudge = async (req, res) => {
    try {
        const { nudgeId } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.engagement) {
            user.engagement = { dismissedNudges: [], unlockedNudges: [] };
        }

        if (!user.engagement.dismissedNudges.includes(nudgeId)) {
            user.engagement.dismissedNudges.push(nudgeId);
            await user.save();
        }

        res.json({ success: true, engagement: user.engagement });
    } catch (error) {
        res.status(500).json({ message: 'Error dismissing nudge' });
    }
};
