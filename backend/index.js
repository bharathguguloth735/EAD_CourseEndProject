require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

// Socket.io context middleware
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/bookings',  require('./routes/bookings'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/ratings',   require('./routes/ratings'));
app.use('/api/waitlist',  require('./routes/waitlist'));
app.use('/api/payment',   require('./routes/payment'));
app.use('/api/notifications', require('./routes/notifications'));

// Diagnostic Ping Route
app.get('/api/ping', (req, res) => res.json({ status: 'Mainframe Active', timestamp: new Date() }));

// Global Error Logging
app.use((err, req, res, next) => {
    console.error('SYSTEM PANIC:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Socket handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their notification room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT} (with Socket.io)`));
