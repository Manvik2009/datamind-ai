import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { isProduction } from '../config/env.js';
import { getRequestId } from './requestId.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = getRequestId(req);
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message =
    err instanceof AppError ? err.message : 'An unexpected error occurred';
  const details = err instanceof AppError ? err.details : undefined;

  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: isProduction() ? undefined : err.stack,
    url: req.originalUrl,
    method: req.method,
    statusCode,
    code,
  });

  const response = errorResponse(code, message, isProduction() ? undefined : details, req.originalUrl);
  res.status(statusCode).json({
    ...response,
    error: {
      ...response.error,
      request_id: requestId,
    },
  });
};
