import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const validateRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      logger.error('Validation error', { error: String(error) });
      const response = errorResponse(
        'VALIDATION_ERROR',
        'Invalid request payload',
        error instanceof Error ? error.message : undefined,
        req.originalUrl
      );
      res.status(400).json(response);
    }
  };
