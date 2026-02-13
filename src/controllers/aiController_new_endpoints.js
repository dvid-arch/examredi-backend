import { v4 as uuidv4 } from 'uuid';

// @desc    Create a new conversation
// @route   POST /api/ai/conversations/new
export const createConversation = async (req, res) => {
    const userId = req.user.id;

    try {
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
