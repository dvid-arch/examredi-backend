import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true,
        default: () => Date.now()
    }
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    conversationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    messages: {
        type: [chatMessageSchema],
        default: [],
        validate: {
            validator: function (messages) {
                return messages.length <= 50;
            },
            message: 'Conversation cannot exceed 50 messages'
        }
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
chatHistorySchema.index({ userId: 1, lastAccessedAt: -1 });

// TTL index to auto-delete conversations after 30 days of inactivity
chatHistorySchema.index({ lastAccessedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Method to add a message and trim if needed
chatHistorySchema.methods.addMessage = function (role, text) {
    this.messages.push({ role, text, timestamp: Date.now() });

    // Trim to max 50 messages (remove oldest)
    if (this.messages.length > 50) {
        this.messages = this.messages.slice(-50);
    }

    this.lastAccessedAt = new Date();
};

// Static method to get conversation preview
chatHistorySchema.statics.getConversationPreview = function (conversation) {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return {
        conversationId: conversation.conversationId,
        preview: lastMessage ? lastMessage.text.substring(0, 100) : 'New conversation',
        lastAccessedAt: conversation.lastAccessedAt,
        messageCount: conversation.messages.length,
        createdAt: conversation.createdAt
    };
};

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
