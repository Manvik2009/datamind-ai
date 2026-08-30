import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { getSupabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

type ResourceType = 'dataset' | 'experiment' | 'model' | 'prediction' | 'scenario' | 'report';

interface ResourceOwnership {
  table: string;
  ownerColumn: string;
}

const RESOURCE_MAP: Record<ResourceType, ResourceOwnership> = {
  dataset: { table: 'datasets', ownerColumn: 'user_id' },
  experiment: { table: 'ml_experiments', ownerColumn: 'user_id' },
  model: { table: 'ml_models', ownerColumn: 'user_id' },
  prediction: { table: 'decision_predictions', ownerColumn: 'user_id' },
  scenario: { table: 'decision_scenarios', ownerColumn: 'user_id' },
  report: { table: 'decision_reports', ownerColumn: 'user_id' },
};

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  next();
}

export function requireOwnership(resourceType: ResourceType) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const resourceId = req.params.id || req.query.resource_id as string;
    if (!resourceId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Resource ID required');
    }

    const config = RESOURCE_MAP[resourceType];

    try {
      const { data, error } = await getSupabase()
        .from(config.table)
        .select(config.ownerColumn)
        .eq('id', resourceId)
        .single();

      if (error || !data) {
        throw new AppError(404, 'NOT_FOUND', `${resourceType} not found`);
      }

      const ownerId = (data as unknown as Record<string, unknown>)[config.ownerColumn] as string;

      if (ownerId !== req.user.id && req.user.role !== 'admin') {
        logger.warn('Authorization failure', {
          userId: req.user.id,
          resourceType,
          resourceId,
          ownerId,
        });
        throw new AppError(403, 'FORBIDDEN', 'You do not have access to this resource');
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      logger.error('Authorization check failed', {
        error: (err as Error).message,
        resourceType,
        resourceId,
      });
      throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Authorization check failed');
    }
  };
}

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    next();
  };
}
