import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-dev-secret-change-in-production';

export interface TokenPayload {
  username: string;
  userId: string;
  iat?: number;
  exp?: number;
}

export function generateToken(username: string, userId: string): string {
  return jwt.sign({ username, userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function authenticateSocket(
  token: string | undefined,
  callback: (success: boolean, payload?: TokenPayload, error?: string) => void
): void {
  if (!token) {
    callback(false, undefined, 'No token provided');
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    callback(false, undefined, 'Invalid or expired token');
    return;
  }

  callback(true, payload);
}