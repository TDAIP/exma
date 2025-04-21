const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Broadcast drawing data to all clients
    socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
    });

    // Broadcast color change to all clients
    socket.on('colorChange', (color) => {
        socket.broadcast.emit('colorChange', color);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});