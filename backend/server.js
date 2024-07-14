import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import userRouter from './Routes/user.route.js';
import messageRouter from './Routes/message.route.js';
import conversationRouter from './Routes/conversation.route.js';

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

app.use('/api/users', userRouter);
app.use('/api/messages', messageRouter);
app.use('/api/conversations', conversationRouter);

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        console.log(`${username} joined ${room}`);
    });

    socket.on('sendMessage', (message) => {
        io.to(message.conversationId).emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3010, () => {
    console.log('Server is running on port 3010');
});

