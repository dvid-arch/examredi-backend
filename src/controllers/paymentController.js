import axios from 'axios';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// @desc    Initialize Paystack transaction
// @route   POST /api/payments/initialize
export const initializePayment = async (req, res) => {
    try {
        const { planType } = req.body; // 'day_pass', 'monthly', 'yearly'
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Pricing logic
        let amount = 0;
        if (planType === 'day_pass') amount = 200 * 100; // ₦200 in kobo
        else if (planType === 'monthly') amount = 2500 * 100; // ₦2500 in kobo
        else if (planType === 'yearly') amount = 2000 * 12 * 100; // ₦20,000 (discounted) in kobo
        else return res.status(400).json({ message: 'Invalid plan type' });

        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: user.email || `${user.name.replace(/\s+/g, '').toLowerCase()}@examredi.com`,
                amount,
                metadata: {
                    userId,
                    planType
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Create a pending transaction record
        await Transaction.create({
            userId,
            reference: response.data.data.reference,
            amount: amount / 100,
            planType,
            status: 'pending'
        });

        res.json(response.data.data);
    } catch (error) {
        console.error('Paystack Init Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Error initializing payment' });
    }
};

// @desc    Verify Paystack payment (Webhook)
// @route   POST /api/payments/webhook
export const handleWebhook = async (req, res) => {
    // Note: In production, you should verify the Paystack signature using crypto
    const { event, data } = req.body;

    if (event === 'charge.success') {
        const { reference, metadata } = data;
        const { userId, planType } = metadata;

        try {
            const transaction = await Transaction.findOne({ reference });
            if (transaction && transaction.status === 'pending') {
                transaction.status = 'success';
                await transaction.save();

                const user = await User.findById(userId);
                if (user) {
                    user.subscription = 'pro';

                    // Set expiry date
                    const now = new Date();
                    if (planType === 'day_pass') {
                        user.subscriptionExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    } else if (planType === 'monthly') {
                        user.subscriptionExpiry = new Date(now.setMonth(now.getMonth() + 1));
                    } else if (planType === 'yearly') {
                        user.subscriptionExpiry = new Date(now.setFullYear(now.getFullYear() + 1));
                    }

                    await user.save();
                }
            }
            return res.sendStatus(200);
        } catch (error) {
            console.error('Webhook Error:', error);
            return res.sendStatus(500);
        }
    }

    res.sendStatus(200);
};
