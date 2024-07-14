import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from "../models/Conversation.js"
import { io } from '../server.js';
export const sendMessage = async (req, res) => {
    const { senderUsername, receiverUsername, message } = req.body;

    try {
        // Find sender and receiver by username
        const sender = await User.findOne({ username: senderUsername });
        const receiver = await User.findOne({ username: receiverUsername });

        if (!sender || !receiver) {
            return res.status(400).json({ error: 'Invalid sender or receiver username' });
        }

        // Check for existing conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [sender._id, receiver._id] }
        });

        // If no conversation exists, create a new one
        if (!conversation) {
            conversation = new Conversation({
                participants: [sender._id, receiver._id]
            });
            await conversation.save();
        }

        // Create and save new message
        const newMessage = new Message({
            senderUsername,
            receiverUsername,
            message,
            conversationId: conversation._id
        });

        const savedMessage = await newMessage.save();
        
        // Update the conversation to include this message
        conversation.messages.push(savedMessage._id);
        await conversation.save();

        // Emit the message to the relevant room
        io.to(conversation._id.toString()).emit('message', {
            senderUsername,
            receiverUsername,
            message,
            conversationId: conversation._id
        });

        res.status(200).json(savedMessage);
    } catch (err) {
        console.error("Error saving message:", err);
        res.status(500).json(err);
    }
};
// Get messages by conversation ID
export const getMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId)
            .populate('messages'); // Just populate messages without nested fields

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.status(200).json(conversation);
    } catch (err) {
        console.error("Error fetching conversation:", err);
        res.status(500).json(err);
    }
};
