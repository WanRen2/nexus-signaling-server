import { Server, Socket } from 'socket.io';
import type { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  IceCandidatePayload,
} from './types';
import { authenticateSocket, TokenPayload } from './auth';

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const activeUsers = new Map<string, string>();
const socketToUser = new Map<string, string>();

export function setupSocketHandlers(io: TypedServer): void {
  io.use((socket: TypedSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    authenticateSocket(token, (success, payload, error) => {
      if (!success || !payload) {
        console.log(`Auth failed: ${error}`);
        return next(new Error(error || 'Authentication failed'));
      }

      socket.data.username = payload.username;
      socket.data.userId = payload.userId;
      socket.data.authenticated = true;

      console.log(`Authenticated: ${payload.username} (${socket.id})`);
      next();
    });
  });

  io.on('connection', (socket: TypedSocket) => {
    const username = socket.data.username;

    activeUsers.set(username, socket.id);
    socketToUser.set(socket.id, username);

    console.log(`Connected: ${username} (${socket.id}), Active: ${activeUsers.size}`);

    socket.broadcast.emit('userJoined', { username, socketId: socket.id });

    socket.on('join', (data, callback) => {
      const { username: clientUsername } = data;

      if (clientUsername !== username) {
        return callback({ success: false, message: 'Username mismatch' });
      }

      console.log(`${username} joined`);
      callback({ success: true });
    });

    socket.on('offer', ({ to, sdp }) => {
      const targetSocketId = activeUsers.get(to);

      if (!targetSocketId) {
        console.log(`User ${to} not found for offer from ${username}`);
        socket.emit('error', { message: `User ${to} is offline` });
        return;
      }

      console.log(`Offer: ${username} -> ${to}`);

      io.to(targetSocketId).emit('offer', { from: username, sdp });
    });

    socket.on('answer', ({ to, sdp }) => {
      const targetSocketId = activeUsers.get(to);

      if (!targetSocketId) {
        console.log(`User ${to} not found for answer from ${username}`);
        socket.emit('error', { message: `User ${to} is offline` });
        return;
      }

      console.log(`Answer: ${username} -> ${to}`);

      io.to(targetSocketId).emit('answer', { from: username, sdp });
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
      const targetSocketId = activeUsers.get(to);

      if (!targetSocketId) {
        console.log(`User ${to} not found for ICE from ${username}`);
        return;
      }

      console.log(`ICE: ${username} -> ${to}`);

      io.to(targetSocketId).emit('iceCandidate', { from: username, candidate });
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('leave', ({ username: leavingUsername }) => {
      if (leavingUsername === username) {
        console.log(`${username} left`);
        socket.broadcast.emit('userLeft', { username });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected: ${username}, reason: ${reason}`);

      activeUsers.delete(username);
      socketToUser.delete(socket.id);

      console.log(`Active: ${activeUsers.size}`);

      socket.broadcast.emit('userLeft', { username });
    });
  });

  setInterval(() => {
    console.log(`Health check - Active: ${activeUsers.size}`);
  }, 30000);
}

export function getActiveUsers(): string[] {
  return Array.from(activeUsers.keys());
}

export function isUserOnline(username: string): boolean {
  return activeUsers.has(username);
}