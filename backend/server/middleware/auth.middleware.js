import { Hono } from 'hono';
import { getPrisma } from '../config/prisma.js';
import jwt from 'jsonwebtoken';

export const authMiddleware = async (c, next) => {
  let token = null;
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = c.req.query('auth_token');
  }

  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const secret = c.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");
    const decoded = jwt.verify(token, secret);
    c.set('user', decoded);
    c.set('userId', decoded.userId);
    await next();
  } catch (err) { 
    console.error("Auth Middleware Error:", err.message);
    return c.json({ error: 'Invalid or expired token' }, 401); 
  }
};
