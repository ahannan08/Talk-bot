import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { io } from '../server.js'; // Import the io instance
import Conversation from '../models/Conversation.js'; // Import the Conversation model
import mongoose from 'mongoose'; // Import mongoose to create ObjectId

// Register user
export const registerUser = async (req, res) => {
    const { username, password, isAdmin } = req.body;

    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ username, password, isAdmin: isAdmin || false });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Get ObjectIds for admin and new user
        const adminId = new mongoose.Types.ObjectId('6691220c5dff689efe41188f'); // Replace with actual admin ID lookup if needed
        const newUserId = user._id;

        // Create a new conversation with ObjectIds
        const newConversation = new Conversation({
            participants: [adminId, newUserId],
        });
        await newConversation.save();

        const userInfo = { username: user.username, isAdmin: user.isAdmin, conversationId: newConversation._id }; // Include conversationId
        io.emit('userRegistered', userInfo);
        
        res.status(201).json({ msg: 'User registered successfully', conversationId: newConversation._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Login user
export const loginUser = async (req, res) => {
    console.log("Login request received"); // Log at the start of the function

    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        console.log("User found:", user); // Log the user object

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create the payload including isAdmin
        const payload = {
            user: {
                id: user.id,
                isAdmin: user.isAdmin, // Include isAdmin
            },
        };
        
        jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            // Send the token and isAdmin status
            res.status(200).json({
                token,
                isAdmin: user.isAdmin, // Include isAdmin in the response
                username: user.username,
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
