# Nexus Signaling Server

WebSocket signaling server for P2P video calls using Socket.IO.

## Quick Start

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| JWT_SECRET | JWT secret for auth | nexus-dev-secret-key-12345 |

## Socket.IO Events

### Client → Server

- `join-room` - Join a signaling room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `ready` - Signal ready for call
- `leave-room` - Leave room

### Server → Client

- `user-joined` - User joined room
- `user-left` - User left room
- `room-joined` - Confirmation with room users
- `offer` - WebRTC offer received
- `answer` - WebRTC answer received
- `ice-candidate` - ICE candidate received
- `user-ready` - Remote user ready
- `error` - Error message

## Deploy to Render.com

1. Push to GitHub
2. Create new Web Service on Render.com
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable `JWT_SECRET`