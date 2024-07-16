import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.route.js'; // Adjust paths as needed
import userRoutes from './routes/user.route.js'; // Adjust paths as needed
import messageRoutes from './routes/message.route.js'; // Adjust paths as needed
import conversationRoutes from './routes/conversation.route.js'; 


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


app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/users', userRoutes); // User routes
app.use('/api/messages', messageRoutes); // Message routes
app.use('/api/conversations', conversationRoutes); // Conversation routes

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        console.log(`${username} joined ${room}`);
    });
    socket.on('sendMessage', async (message) => {
        try {
            const newMessage = new Message(message);
            await newMessage.save();
            io.to(message.conversationId).emit('message', newMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3010, () => {
    console.log('Server is running on port 3010');
});

