const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the socket.io client library
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(require.resolve('socket.io/client-dist/socket.io.js'));
});

// Handle missing favicon.ico requests
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

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