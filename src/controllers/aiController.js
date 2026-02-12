import { GoogleGenAI } from "@google/genai";
import TopicCache from '../models/TopicCache.js';
import User from '../models/User.js';

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable not set.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

const missingApiKeyError = { message: "The AI service is not configured on the server." };

const buildHistory = (history) => {
    return history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];
const FREE_TIER_MESSAGES = 5;

// @desc    Handle AI chat messages
// @route   POST /api/ai/chat
export const handleAiChat = async (req, res) => {
    const { message, history } = req.body;
    const userId = req.user.id;
    const ai = getAiInstance();
    if (!ai) return res.status(500).json(missingApiKeyError);

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.subscription === 'free') {
            const today = getTodayDateString();
            if (user.lastMessageDate !== today) {
                user.dailyMessageCount = 0;
                user.lastMessageDate = today;
            }
            if (user.dailyMessageCount >= FREE_TIER_MESSAGES) {
                return res.status(403).json({ message: "You have reached your daily message limit." });
            }
            user.dailyMessageCount += 1;
            await user.save();
        }

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: buildHistory(history || []),
            config: {
                systemInstruction: `You are Ai-buddy, a friendly and encouraging AI tutor for ExamRedi. Your goal is to help students understand complex topics and prepare for their exams. Keep your tone positive and supportive. Format responses using markdown.`,
            },
        });
        const result = await chat.sendMessage({ message });
        res.json({ reply: result.text });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ message: "Error communicating with AI service." });
    }
};

const handleCreditUsage = async (userId, cost) => {
    try {
        const user = await User.findById(userId);
        if (!user) return { success: false, message: "User not found" };

        if (user.subscription === 'free') {
            return { success: false, message: "This feature is for Pro users only." };
        }
        if (user.aiCredits < cost) {
            return { success: false, message: "Insufficient AI credits." };
        }

        user.aiCredits -= cost;
        await user.save();
        return { success: true };
    } catch (error) {
        console.error("Credit Usage Error:", error);
        return { success: false, message: "Server error checking credits." };
    }
};

// @desc    Generate a study guide
// @route   POST /api/ai/generate-guide
export const handleGenerateGuide = async (req, res) => {
    const { subject, topic } = req.body;
    const creditCheck = await handleCreditUsage(req.user.id, 1);
    if (!creditCheck.success) return res.status(403).json({ message: creditCheck.message });

    const ai = getAiInstance();
    if (!ai) return res.status(500).json(missingApiKeyError);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a study guide for the subject "${subject}" on the topic "${topic}".`,
            config: {
                systemInstruction: `You are an expert educator. Create a concise, easy-to-understand study guide. Use clear headings, bullet points, and simple language. Use markdown for formatting.`,
            }
        });
        res.json({ guide: response.text });
    } catch (error) {
        console.error("Gemini Guide Generation Error:", error);
        res.status(500).json({ message: "Error generating study guide." });
    }
};

// @desc    Research a topic (course/university)
// @route   POST /api/ai/research
export const handleResearch = async (req, res) => {
    const { searchType, query } = req.body;
    const creditCheck = await handleCreditUsage(req.user.id, 1);
    if (!creditCheck.success) return res.status(403).json({ message: creditCheck.message });

    const ai = getAiInstance();
    if (!ai) return res.status(500).json(missingApiKeyError);

    let prompt = '';
    if (searchType === 'university') {
        prompt = `Provide a detailed overview of the Nigerian university: "${query}". Include its history, notable alumni, faculties, admission requirements, and student life.`;
    } else {
        prompt = `Generate a guide for a Nigerian student considering a career in "${query}". Include required JAMB subjects, top Nigerian universities offering it, career paths, and necessary skills.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: `You are a knowledgeable career and academic advisor for Nigerian students. Provide accurate, detailed, and encouraging information. Use markdown formatting.`,
            }
        });
        res.json({ result: response.text });
    } catch (error) {
        console.error("Gemini Research Error:", error);
        res.status(500).json({ message: "Error researching topic." });
    }
};

// @desc    Get semantic keywords for a topic
// @route   POST /api/ai/topic-keywords
export const handleGetTopicKeywords = async (req, res) => {
    const { topic, subject } = req.body;
    if (!topic || !subject) return res.status(400).json({ message: "Topic and subject are required." });

    try {
        // 1. Check cache first
        const cacheEntry = await TopicCache.findOne({
            topic: topic.toLowerCase(),
            subject: subject.toLowerCase()
        });

        if (cacheEntry) {
            console.log(`Cache Hit for topic: ${topic}`);
            return res.json({ keywords: cacheEntry.keywords });
        }

        // 2. Generate if not in cache
        const ai = getAiInstance();
        if (!ai) return res.status(500).json(missingApiKeyError);

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: `For the student subject "${subject}", provide a JSON array of 8-12 diverse keywords or short phrases that are highly relevant to the specific topic "${topic}". Include synonyms, related sub-concepts, and key terms typically found in past questions. Output ONLY the JSON array. Example: ["Chlorophyll", "Mitochondria", ...]`,
        });

        const text = response.text;
        const jsonMatch = text.match(/\[.*\]/s);
        const keywords = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // 3. Save to cache ONLY if we have valid keywords
        if (keywords.length > 0) {
            await TopicCache.create({
                topic: topic.toLowerCase(),
                subject: subject.toLowerCase(),
                keywords
            });
            console.log(`Cache Miss - Saved new keywords for topic: ${topic}`);
        } else {
            // Fallback if AI returns empty array or partial nonsense
            keywords.push(topic);
        }

        res.json({ keywords });
    } catch (error) {
        console.error("Gemini/Cache Keywords Error:", error);
        res.json({ keywords: [topic] }); // Fallback to the topic itself
    }
};
