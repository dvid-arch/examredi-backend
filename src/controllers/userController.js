import User from '../models/User.js';

// @desc    Update user profile
// @route   PUT /api/user/profile
export const updateProfile = async (req, res) => {
    try {
        const { name, studyPlan } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (studyPlan) {
            user.studyPlan = {
                ...user.studyPlan,
                ...studyPlan
            };
        }

        await user.save();

        const safeUser = await User.findById(userId).select('-password');
        res.json(safeUser);
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};
