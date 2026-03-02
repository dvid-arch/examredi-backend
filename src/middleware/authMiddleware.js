import { createClerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify Clerk token
            const decoded = await clerkClient.verifyToken(token);
            const clerkId = decoded.sub;

            // Fetch user from MongoDB by clerkId
            let user = await User.findOne({ clerkId }).select('-password');

            // If not found by clerkId, try by email (migration step)
            if (!user) {
                const clerkUser = await clerkClient.users.getUser(clerkId);
                const email = clerkUser.emailAddresses[0]?.emailAddress;

                if (email) {
                    user = await User.findOne({ email }).select('-password');
                    if (user) {
                        // Link existing user to Clerk
                        user.clerkId = clerkId;
                        await user.save();
                    } else {
                        // Create new user if they don't exist in MongoDB but are in Clerk
                        user = await User.create({
                            clerkId,
                            email,
                            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
                            isVerified: true,
                            role: 'user'
                        });
                    }
                }
            }

            if (!user) {
                return res.status(401).json({ message: 'User not found or sync failed' });
            }

            req.user = user;
            req.clerkId = clerkId;

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = await clerkClient.verifyToken(token);
            const clerkId = decoded.sub;

            req.user = await User.findOne({ clerkId }).select('-password');
            req.clerkId = clerkId;
            next();
        } catch (error) {
            // Even if token fails, allowed as optional
            console.error('Optional Auth Error:', error);
            next();
        }
    } else {
        next();
    }
};
