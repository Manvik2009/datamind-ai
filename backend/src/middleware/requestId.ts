import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  res.setHeader('X-Request-ID', requestId);

  (req as Request & { requestId: string }).requestId = requestId;

  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}

export function getRequestId(req: Request): string {
  return (req as Request & { requestId?: string }).requestId || 'unknown';
}
