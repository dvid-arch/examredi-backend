import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';

import connectDB from './db/connect.js';
import passport from 'passport';
import configurePassport from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Passport Initialiation
configurePassport(passport);
app.use(passport.initialize());

app.set('trust proxy', 1);
const port = process.env.PORT || 5000;

// Connect to Database
// Connect to Database
connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n========== REQUEST LOG ==========`);
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    console.log(`Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log(`Client IP: ${req.ip}`);
    console.log(`Headers:`, req.headers);
    if (Object.keys(req.body).length > 0) {
        console.log(`Body:`, req.body);
    }
    console.log(`================================\n`);

    // Log response
    const originalSend = res.send;
    res.send = function (data) {
        console.log(`[${timestamp}] Response Status: ${res.statusCode}`);
        return originalSend.call(this, data);
    };

    next();
});

// Basic health check for API
app.get('/api/health', (req, res) => {
    res.send('ExamRedi API is running!');
});

// Serve frontend static assets from build directory
const feBuildPath = path.join(__dirname, '../../fe/examredife/dist');
app.use(express.static(feBuildPath));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/flashcards', flashcardRoutes);

// Catch-all route for React Browser Routing
app.get('*', (req, res) => {
    // If we're not handling an API route, serve the frontend
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(feBuildPath, 'index.html'));
    } else {
        res.status(404).json({ message: 'API route not found' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
