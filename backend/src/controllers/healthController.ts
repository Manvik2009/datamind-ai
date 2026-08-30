import { Request, Response } from 'express';
import { HealthService } from '../services/healthService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  const health = await HealthService.getFullHealth();
  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(successResponse(health, req.originalUrl));
});

export const getLiveness = asyncHandler(async (req: Request, res: Response) => {
  const liveness = HealthService.getLiveness();
  res.status(200).json(successResponse(liveness, req.originalUrl));
});

export const getReadiness = asyncHandler(async (req: Request, res: Response) => {
  const readiness = await HealthService.getReadiness();
  const statusCode = readiness.status === 'down' ? 503 : 200;
  res.status(statusCode).json(successResponse(readiness, req.originalUrl));
});
