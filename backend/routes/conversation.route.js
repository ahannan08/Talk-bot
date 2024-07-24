import express from 'express';
import { createConversation, getConversationId, initiateConversation } from '../controllers/conversation.controller.js';
const router = express.Router();

// Create a new conversation
router.post('/', createConversation);

// Get conversation ID by sender and receiver usernames
router.get('/:senderUsername/:receiverUsername', getConversationId);

// Start a chat with an admin based on gender preference
router.post('/start-chat', async (req, res) => {
    const { userId, genderPreference } = req.body;
    try {
        const conversation = await initiateConversation(userId, genderPreference);
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
