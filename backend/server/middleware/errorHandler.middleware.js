import { AppError } from '../utils/errors/index.js';
import { logSecureError } from '../logging/logger.js';

export const globalErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({
      error: err.message,
      code: err.code
    }, err.statusCode);
  }

  // Handle expected Prisma Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return c.json({ error: 'A record with this value already exists', code: 'DUPLICATE_ERROR' }, 409);
    }
    if (err.code === 'P2025') {
      return c.json({ error: 'Record not found', code: 'NOT_FOUND_ERROR' }, 404);
    }
    return c.json({ error: 'Database transaction failed', code: 'DB_ERROR' }, 400);
  }

  // Unhandled errors
  console.error('[UNHANDLED ERROR]', err);
  if (c.env && c.env.NODE_ENV === 'production') {
    return c.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, 500);
  }

  return c.json({ error: err.message, stack: err.stack, code: 'INTERNAL_ERROR' }, 500);
};
