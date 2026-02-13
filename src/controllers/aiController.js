import { GoogleGenAI } from "@google/genai";
import TopicCache from '../models/TopicCache.js';
import User from '../models/User.js';
import ChatHistory from '../models/ChatHistory.js';
import { getNormalizedSubjectName } from '../utils/subjects.js';
import mongoose from 'mongoose';

const getAiInstance = () => {
    const apiKey = process.env.GEMINI_API_KEY;
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
    const { message, conversationId } = req.body;
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

        // Load conversation history from database if conversationId provided
        let conversation = null;
        let history = [];

        if (conversationId) {
            conversation = await ChatHistory.findOne({ conversationId, userId });
            if (conversation) {
                history = conversation.messages;
            }
        }

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: buildHistory(history),
            config: {
                systemInstruction: `You are Ai-buddy, a friendly and encouraging AI tutor for ExamRedi. Your goal is to help students understand complex topics and prepare for their exams. Keep your tone positive and supportive. Format responses using markdown.`,
            },
        });
        const result = await chat.sendMessage({ message });

        // Save conversation to database
        if (conversation) {
            conversation.addMessage('user', message);
            conversation.addMessage('model', result.text);
            await conversation.save();
        }

        res.json({ reply: result.text, conversationId: conversationId || null });
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
    const { subject: rawSubject, topic } = req.body;
    const subject = getNormalizedSubjectName(rawSubject);
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
    const { topic, subject: rawSubject } = req.body;
    if (!topic || !rawSubject) return res.status(400).json({ message: "Topic and subject are required." });

    const subject = getNormalizedSubjectName(rawSubject);

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
            contents: `You are helping students find relevant past exam questions for the topic "${topic}" in ${subject}.

Generate a JSON array of 15-20 search terms that would appear in exam questions about this topic. Include:
1. The topic name itself and common variations/abbreviations
2. Key concepts and processes (use broad, general terms)
3. Specific terminology and technical terms
4. Related subtopics and practical applications
5. Common question phrases (e.g., "process by which", "function of", "used to")

Guidelines:
- Mix broad terms (high recall) with specific terms (high precision)
- Include partial words that might appear in compound terms
- Use lowercase for better matching
- Avoid overly technical jargon that rarely appears in questions

Example for "Photosynthesis":
["photosynthesis", "photosynth", "light energy", "chlorophyll", "chloroplast", "glucose production", "carbon dioxide", "oxygen", "light reaction", "dark reaction", "calvin cycle", "process by which plants", "conversion of light", "green plants", "autotroph", "food production", "sunlight", "leaves"]

Output ONLY the JSON array with NO explanation.`,
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

// @desc    Create a new conversation
// @route   POST /api/ai/conversations/new
export const createConversation = async (req, res) => {
    const userId = req.user.id;

    try {
        const { v4: uuidv4 } = await import('uuid');
        const conversationId = uuidv4();
        const conversation = await ChatHistory.create({
            userId,
            conversationId,
            messages: []
        });

        res.status(201).json({ conversationId: conversation.conversationId });
    } catch (error) {
        console.error("Create Conversation Error:", error);
        res.status(500).json({ message: "Error creating conversation." });
    }
};

// @desc    Get all user conversations (metadata only)
// @route   GET /api/ai/conversations
export const getConversations = async (req, res) => {
    const userId = req.user.id;

    try {
        const conversations = await ChatHistory.find({ userId })
            .sort({ lastAccessedAt: -1 })
            .select('conversationId messages lastAccessedAt createdAt')
            .limit(50);

        const conversationList = conversations.map(conv =>
            ChatHistory.getConversationPreview(conv)
        );

        res.json({ conversations: conversationList });
    } catch (error) {
        console.error("Get Conversations Error:", error);
        res.status(500).json({ message: "Error retrieving conversations." });
    }
};

// @desc    Get a specific conversation
// @route   GET /api/ai/conversations/:conversationId
export const getConversation = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        const conversation = await ChatHistory.findOne({ conversationId, userId });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        // Update last accessed time
        conversation.lastAccessedAt = new Date();
        await conversation.save();

        res.json({
            conversationId: conversation.conversationId,
            messages: conversation.messages,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
        });
    } catch (error) {
        console.error("Get Conversation Error:", error);
        res.status(500).json({ message: "Error retrieving conversation." });
    }
};

// @desc    Delete a conversation
// @route   DELETE /api/ai/conversations/:conversationId
export const deleteConversation = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        const result = await ChatHistory.deleteOne({ conversationId, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        res.json({ success: true, message: "Conversation deleted successfully." });
    } catch (error) {
        console.error("Delete Conversation Error:", error);
        res.status(500).json({ message: "Error deleting conversation." });
    }
};
