import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// Helper: Generate Access Token (Short-lived)
export const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Helper: Generate Refresh Token (Long-lived)
export const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};


const getTodayDateString = () => new Date().toISOString().split('T')[0];

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Validate Password Strength
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        // Adjusted regex: Min 8 chars, at least one letter, one number. Removed strict symbol requirement to avoid "bad UX" per user request, but kept length and mixed types.
        // Actually, let's stick to the simpler rule approved: 8 chars, 1 number, 1 uppercase OR symbol.

        const hasNumber = /\d/.test(password);
        const hasUpperOrSymbol = /[A-Z@$!%*#?&]/.test(password);
        const isLongEnough = password.length >= 8;

        if (!hasNumber || !hasUpperOrSymbol || !isLongEnough) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and contain at least one number and one uppercase letter or symbol.'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user (password hashing handled by pre-save hook in model)
        const user = await User.create({
            name,
            email,
            password,
            subscription: 'free',
            role: 'user',
            studyPlan: { // Initialize with defaults
                targetScore: 250,
                weakSubjects: [],
                dailyGoal: 10
            }
        });

        if (user) {
            // Generate Verification Token
            const verificationToken = user.getVerificationToken();
            await user.save(); // Save the token to DB

            // Create Verification URL
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const verifyUrl = `${frontendUrl}/#/verify-email/${verificationToken}`;

            const message = `
                <h1>Email Verification</h1>
                <p>Please verify your email to unlock full features.</p>
                <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
            `;

            try {
                console.log('Sending verification email to:', user.email);
                await sendEmail({
                    email: user.email,
                    subject: 'ExamRedi Email Verification',
                    html: message
                });
                console.log('Verification email sent successfully.');
            } catch (error) {
                console.error("Email send failed:", error.message);
                // Don't fail registration if email fails, just log it.
                // User can request resend later.
                user.verificationToken = undefined;
                await user.save({ validateBeforeSave: false });
            }

            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                role: user.role,
                isVerified: user.isVerified,
                accessToken,
                refreshToken,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        // Check if user exists and has a password set (not an OAuth-only user)
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(400).json({
                message: 'This account was created with Google Sign-In. Please use Google to log in.'
            });
        }

        // Verify password
        if (await user.matchPassword(password)) {
            const accessToken = generateAccessToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                subscription: user.subscription,
                role: user.role,
                isVerified: user.isVerified,
                accessToken,
                refreshToken
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
export const refreshAccessToken = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID just to verify existence
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(403).json({ message: 'Invalid token: User not found' });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id); // Rotate refresh token for security

        res.json({
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error("Refresh token error:", error.message);
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logoutUser = async (req, res) => {
    // Stateless JWTs typically handled on client side by forgetting token.
    // Ideally, add token to a blacklist or DB of revoked tokens.
    // For now, simply return success.
    res.status(204).send();
};


// @desc    Verify User Email
// @route   PUT /api/auth/verifyemail/:token
export const verifyEmail = async (req, res) => {
    try {
        const verificationToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            verificationToken,
            // verification token usually doesn't expire, or we can set an expiry
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ success: true, data: 'Email verified' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error verifying email' });
    }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }

        // Generate Verification Token
        const verificationToken = user.getVerificationToken();
        await user.save();

        // Create Verification URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/#/verify-email/${verificationToken}`;

        const message = `
            <h1>Email Verification</h1>
            <p>Please verify your email to unlock full features.</p>
            <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
        `;

        await sendEmail({
            email: user.email,
            subject: 'ExamRedi Email Verification',
            html: message
        });

        res.status(200).json({ success: true, data: 'Verification email sent' });
    } catch (error) {
        console.error("Resend Verification Error:", error);
        res.status(500).json({ message: 'Server error sending verification email' });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'There is no user with that email' });
        }

        // Get Reset Token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        // Frontend route: /reset-password/:token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/#/reset-password/${resetToken}`;

        const message = `
            You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n <a href="${resetUrl}">${resetUrl}</a>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                html: message
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (error) {
            console.log(error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:token
export const resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, data: 'Password updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

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
        const user = await User.findById(req.user.id).select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Test email configuration
// @route   POST /api/auth/test-email
export const testEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide an email address' });
        }

        console.log('🧪 Testing email configuration...');
        console.log('   Target email:', email);

        const message = `
            <h1>Email Test Successful! ✅</h1>
            <p>This is a test email from ExamRedi to verify that the email service is configured correctly.</p>
            <p>If you're seeing this, Gmail SMTP with Nodemailer is working perfectly!</p>
            <hr>
            <p><small>Sent at: ${new Date().toISOString()}</small></p>
        `;

        await sendEmail({
            email: email,
            subject: 'ExamRedi Email Test',
            html: message
        });

        res.status(200).json({
            success: true,
            message: 'Test email sent successfully! Check your inbox.'
        });
    } catch (error) {
        console.error("Test Email Error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
};