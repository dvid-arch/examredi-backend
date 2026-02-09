import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const configurePassport = (passport) => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.BACKEND_URL
                    ? `${process.env.BACKEND_URL}/api/auth/google/callback`
                    : '/api/auth/google/callback',
                proxy: true,
            },

            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;
                    let user = await User.findOne({ email });

                    if (user) {
                        // Link Google ID if match found by email
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            await user.save();
                        }
                        return done(null, user);
                    }

                    // Create new user if not found
                    user = await User.create({
                        name: profile.displayName,
                        email: email,
                        googleId: profile.id,
                        isVerified: true, // Google accounts are pre-verified
                        subscription: 'free',
                        role: 'user',
                        studyPlan: {
                            targetScore: 250,
                            weakSubjects: [],
                            dailyGoal: 10
                        }
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default configurePassport;
