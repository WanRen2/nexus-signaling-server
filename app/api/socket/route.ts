import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from '@/lib/socket/handlers';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@/lib/socket/types';

declare global {
  var io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | undefined;
}

function initSocketServer() {
  if (global.io) {
    console.log('Reusing existing Socket.IO');
    return global.io;
  }

  console.log('Initializing Socket.IO server...');

  const httpServer = new NetServer();

  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  setupSocketHandlers(io);

  global.io = io;

  console.log('Socket.IO ready at /api/socket');

  return io;
}

export async function GET(req: NextRequest) {
  initSocketServer();

  return NextResponse.json({
    status: 'ok',
    service: 'Nexus Signaling Server',
    version: '1.0.0',
    protocol: 'WebSocket (Socket.IO)',
    endpoint: '/api/socket',
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  initSocketServer();

  try {
    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: 'Use WebSocket for real-time',
      received: body,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON',
    }, {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}