export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'ping';
  from: string;
  to: string;
  roomId?: string;
  payload?: unknown;
  timestamp: number;
}

export interface OfferPayload {
  sdp: string;
  type: 'offer';
}

export interface AnswerPayload {
  sdp: string;
  type: 'answer';
}

export interface IceCandidatePayload {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface JoinPayload {
  username: string;
  token?: string;
}

interface ServerToClientEvents {
  offer: (data: { from: string; sdp: string }) => void;
  answer: (data: { from: string; sdp: string }) => void;
  iceCandidate: (data: { from: string; candidate: IceCandidatePayload }) => void;
  userJoined: (data: { username: string; socketId: string }) => void;
  userLeft: (data: { username: string }) => void;
  error: (data: { message: string }) => void;
  pong: () => void;
}

interface ClientToServerEvents {
  join: (data: JoinPayload, callback: (response: { success: boolean; message?: string }) => void) => void;
  offer: (data: { to: string; sdp: string }) => void;
  answer: (data: { to: string; sdp: string }) => void;
  iceCandidate: (data: { to: string; candidate: IceCandidatePayload }) => void;
  leave: (data: { username: string }) => void;
  ping: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  username: string;
  userId: string;
  authenticated: boolean;
}

export type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData };