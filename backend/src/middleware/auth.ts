import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase.js';
import { AppError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const supabase = getSupabase();
    const result = await supabase.auth.getUser(token);

    if (result.error || !result.data.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    req.user = {
      id: result.data.user.id,
      email: result.data.user.email || '',
      role: result.data.user.role || 'authenticated',
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error('Authentication error', { error: (err as Error).message });
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication failed');
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const supabase = getSupabase();
    supabase.auth.getUser(token).then(({ data }) => {
      if (data.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.role || 'authenticated',
        };
      }
      next();
    }).catch(() => {
      next();
    });
  } else {
    next();
  }
}
