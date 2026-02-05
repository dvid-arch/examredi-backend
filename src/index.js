import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.get('/', (req, res) => {
    res.send('ExamRedi Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/flashcards', flashcardRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
