import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

import { AuthenticatedUser } from '../types/express';

type JwtPayload = {
  sub?: unknown;
  id?: unknown;
  role?: unknown;
  exp?: unknown;
};

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function verifyToken(token: string, secret: string): AuthenticatedUser | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const expectedSignature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const receivedSignature = Buffer.from(encodedSignature, 'base64url');

  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload)) as JwtPayload;
  } catch {
    return null;
  }

  const id = typeof payload.id === 'string'
    ? payload.id
    : typeof payload.sub === 'string'
      ? payload.sub
      : null;

  if (!id || (payload.exp !== undefined &&
      (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)))) {
    return null;
  }

  return {
    id,
    role: typeof payload.role === 'string' ? payload.role : undefined
  };
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.header('authorization');
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    res.status(500).json({ message: 'Authentication is not configured' });
    return;
  }

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authorization token is required' });
    return;
  }

  const user = verifyToken(authorization.slice('Bearer '.length).trim(), secret);
  if (!user) {
    res.status(401).json({ message: 'Invalid or expired authorization token' });
    return;
  }

  req.user = user;
  next();
}
