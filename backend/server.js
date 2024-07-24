import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import messageRoutes from './routes/message.route.js';
import conversationRoutes from './routes/conversation.route.js';
import Message from './models/Message.js';
import User from './models/User.js';

// Initialize express app
const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3002"],
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3002"]
}));
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb+srv://messi:messi@ntcluster.4xpi75r.mongodb.net/?retryWrites=true&w=majority&appName=NTcluster", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected");
}).catch(err => console.error(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        console.log(`${username} joined ${room}`);
    });

    socket.on('userOnline', async (username) => {
        try {
            await User.updateOne({ username }, { isOnline: true });
            io.emit('statusUpdate', { username, isOnline: true });
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    });



    socket.on('typing', ({ conversationId, username }) => {
        socket.to(conversationId).emit('typing', { username });
    });

    socket.on('stopTyping', ({ conversationId, username }) => {
        socket.to(conversationId).emit('stopTyping', { username });
    });

    socket.on('sendMessage', (messageData) => {
        const { conversationId } = messageData;
        io.to(conversationId).emit('message', messageData);
    });

    socket.on('markAsRead', async ({ messageId, username, conversationId }) => {
        try {
            // Add the username to the readBy field
            await Message.updateOne(
                { _id: messageId },
                { $addToSet: { readBy: username } }
            );

            // Notify clients about the read receipt
            const message = await Message.findById(messageId);
            io.to(conversationId).emit('messageRead', { messageId, readBy: message.readBy });
        } catch (error) {
            console.error("Error marking message as read:", error);
        }
    });

    socket.on('disconnect', async () => {
        // Handle user disconnection
        const username = socket.username;
        if (username) {
            try {
                await User.updateOne({ username }, { isOnline: false });
                io.emit('statusUpdate', { username, isOnline: false });
            } catch (error) {
                console.error("Error updating user status:", error);
            }
        }
        console.log('Client disconnected');
    });
});

server.listen(3010, () => {
    console.log('Server is running on port 3010');
});
