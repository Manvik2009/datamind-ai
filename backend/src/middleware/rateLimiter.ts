import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { getEnv } from '../config/env.js';
import { AppError } from './errorHandler.js';

const env = getEnv();

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later'));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many authentication attempts, please try again later'));
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many upload requests, please try again later'));
  },
});

export const mlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many ML training requests, please try again later'));
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many AI requests, please try again later'));
  },
});

export const batchPredictionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many batch prediction requests, please try again later'));
  },
});
