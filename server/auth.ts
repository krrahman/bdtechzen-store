import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getDatabase, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bdtechzen_production_signature_key_2026_secured';

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateToken(payload: object, expiresInHours = 48): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

export function rateLimitLogin(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxAttempts = 30;

  const record = loginAttempts.get(ip);
  if (record) {
    if (now - record.firstAttempt < windowMs) {
      if (record.count >= maxAttempts) {
        res.status(429).json({ error: 'Too many login attempts. Please wait a few minutes before trying again.' });
        return;
      }
      record.count++;
    } else {
      loginAttempts.set(ip, { count: 1, firstAttempt: now });
    }
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
  next();
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }

  const db = getDatabase();
  let user = db.users.find((u) => u.id === payload.userId);
  if (!user && payload.role === 'admin') {
    user = db.users.find((u) => u.role === 'admin');
  }

  if (!user) {
    res.status(401).json({ error: 'User account not found' });
    return;
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Administrative privileges required' });
      return;
    }
    next();
  });
}
