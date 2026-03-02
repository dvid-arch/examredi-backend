import User from '../models/User.js';

// @desc    Handle Payment Webhook (Mock)
// @route   POST /api/auth/webhook
export const handlePaymentWebhook = async (req, res) => {
    const { userId, event, secret } = req.body;

    // In a real app, this secret would be verified against the payment provider's signature
    if (secret !== process.env.PAYMENT_WEBHOOK_SECRET && secret !== 'examredi_secret_123') {
        return res.status(401).json({ message: 'Unauthorized webhook' });
    }

    if (event === 'payment.success') {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.subscription = 'pro';
            user.aiCredits = 10; // Initial pro credits
            await user.save();

            console.log(`User ${userId} upgraded to Pro via Webhook`);
            return res.json({ success: true, message: 'Subscription upgraded' });
        } catch (error) {
            console.error("Webhook Error:", error);
            return res.status(500).json({ message: 'Error processing webhook' });
        }
    }

    res.json({ received: true });
};

// @desc    Get user profile data
// @route   GET /api/auth/profile
export const getUserProfile = async (req, res) => {
    try {
        // req.user is already populated by protect middleware
        if (req.user) {
            res.json(req.user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};
