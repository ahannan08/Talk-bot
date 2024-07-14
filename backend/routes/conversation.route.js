import express from 'express';
import Conversation from '../models/Conversation.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
const router = express.Router();

// Create new conversation
router.post('/', async (req, res) => {
    const { senderId, receiverId } = req.body;

    const newConversation = new Conversation({
        participants: [senderId, receiverId]
    }); 

    try {
        const savedConversation = await newConversation.save();
        res.status(200).json(savedConversation);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get conversation of a user
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    try {
        const conversations = await Conversation.find({
            participants: { $in: [req.params.userId] }
        }).populate('participants', 'username');
        console.log("Fetched conversations from DB:", conversations); // Add this log

        res.status(200).json(conversations);
    } catch (err) {
        res.status(500).json(err);
    }
});

// In your conversation route
router.get('/:senderUsername/:receiverUsername', async (req, res) => {
    const { senderUsername, receiverUsername } = req.params;

    try {
        // Find users by username
        const sender = await User.findOne({ username: senderUsername });
        const receiver = await User.findOne({ username: receiverUsername });

        console.log("Sender:", sender);
        console.log("Receiver:", receiver);

        // Check if users exist
        if (!sender) {
            return res.status(400).json({ error: `Sender "${senderUsername}" not found` });
        }
        if (!receiver) {
            return res.status(400).json({ error: `Receiver "${receiverUsername}" not found` });
        }

        // Use their ObjectIds to find the conversation
        const conversation = await Conversation.findOne({
            participants: { $all: [sender._id, receiver._id] },
        });

        if (conversation) {
            return res.status(200).json({ conversationId: conversation._id });
        } else {
            return res.status(404).json({ error: 'Conversation not found' });
        }
    } catch (err) {
        console.error("Error fetching conversation:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



export default router;
