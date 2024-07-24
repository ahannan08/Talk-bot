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
            conversationId: conversation._id,
            readBy:[]
        });

        const savedMessage = await newMessage.save();
        
        // Update the conversation to include this message
        conversation.messages.push(savedMessage._id);
        await conversation.save();

        // Emit the message to the relevant room
       //io.to(conversation._id.toString()).emit('message', newMessage);

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

// Assuming you're using Express and Mongoose for MongoDB
export const markMessageAsRead = async (req, res) => {
    const { messageId, username, conversationId } = req.body;

    try {
        // Update the readBy field
        await Message.updateOne(
            { _id: messageId },
            { $addToSet: { readBy: username } } // Use $addToSet to avoid duplicate entries
        );

        const updatedMessage = await Message.findById(messageId);
        io.to(conversationId).emit('messageRead', { messageId, readBy: updatedMessage.readBy });

        res.status(200).send('Message marked as read');
    } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).send('Internal Server Error');
    }
};

