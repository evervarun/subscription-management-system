import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { AppError } from '../services/subscription.service';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err.message, err.stack);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, code: err.statusCode });
    return;
  }

  // Mongoose duplicate key error
  if ((err as NodeJS.ErrnoException).name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'A subscription with this tool and vendor already exists', code: 409 });
    return;
  }

  res.status(500).json({ success: false, message: 'Internal server error', code: 500 });
}
