const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'nexus-signaling-server' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Socket.IO server with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  path: '/socket.io',
  transports: ['polling', 'websocket']
});

// JWT_SECRET from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-dev-secret-key-12345';

// Track active rooms and users
const rooms = new Map(); // roomId -> Set<socketId>
const users = new Map(); // socketId -> { roomId, userId }

// JWT validation middleware
function validateToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

  // Join room with authentication
  socket.on('join-room', (data) => {
    const { roomId, token, userId } = data;
    const decoded = validateToken(token);

    if (!decoded) {
      socket.emit('error', { message: 'Invalid token' });
      console.log(`[${socket.id}] Invalid token rejection`);
      return;
    }

    // Leave previous room if any
    const prevRoom = users.get(socket.id)?.roomId;
    if (prevRoom && rooms.has(prevRoom)) {
      rooms.get(prevRoom).delete(socket.id);
      socket.to(prevRoom).emit('user-left', { userId: users.get(socket.id)?.userId });
    }

    // Join new room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    users.set(socket.id, { roomId, userId });

    socket.join(roomId);
    console.log(`[${socket.id}] Joined room ${roomId}, user: ${userId}`);

    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId });

    // Send room info to joining user
    const roomUsers = Array.from(rooms.get(roomId)).filter(id => id !== socket.id);
    socket.emit('room-joined', { roomId, users: roomUsers });
  });

  // WebRTC signaling: offer
  socket.on('offer', (data) => {
    const { roomId, targetUserId, offer } = data;
    const user = users.get(socket.id);
    if (!user || user.roomId !== roomId) return;

    console.log(`[${socket.id}] Sending offer to ${targetUserId} in room ${roomId}`);
    io.to(roomId).emit('offer', {
      senderUserId: user.userId,
      targetUserId,
      offer
    });
  });

  // WebRTC signaling: answer
  socket.on('answer', (data) => {
    const { roomId, targetUserId, answer } = data;
    const user = users.get(socket.id);
    if (!user || user.roomId !== roomId) return;

    console.log(`[${socket.id}] Sending answer to ${targetUserId} in room ${roomId}`);
    io.to(roomId).emit('answer', {
      senderUserId: user.userId,
      targetUserId,
      answer
    });
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice-candidate', (data) => {
    const { roomId, targetUserId, candidate } = data;
    const user = users.get(socket.id);
    if (!user || user.roomId !== roomId) return;

    io.to(roomId).emit('ice-candidate', {
      senderUserId: user.userId,
      targetUserId,
      candidate
    });
  });

  // User ready for call
  socket.on('ready', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    if (!user || user.roomId !== roomId) return;

    socket.to(roomId).emit('user-ready', { userId: user.userId });
  });

  // Leave room
  socket.on('leave-room', (data) => {
    const { roomId } = data;
    handleLeaveRoom(socket, roomId);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`[${socket.id}] Client disconnected`);

    const user = users.get(socket.id);
    if (user?.roomId) {
      handleLeaveRoom(socket, user.roomId);
    }
    users.delete(socket.id);
  });
});

function handleLeaveRoom(socket, roomId) {
  if (!rooms.has(roomId)) return;

  const user = users.get(socket.id);
  rooms.get(roomId).delete(socket.id);

  // Clean up empty rooms
  if (rooms.get(roomId).size === 0) {
    rooms.delete(roomId);
  }

  socket.to(roomId).emit('user-left', { userId: user?.userId });
  socket.leave(roomId);

  console.log(`[${socket.id}] Left room ${roomId}`);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Nexus Signaling Server                         ║
║   Running on port ${PORT}                           ║
║   JWT_SECRET: ${JWT_SECRET.substring(0, 8)}...               ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };