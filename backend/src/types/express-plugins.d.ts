declare module 'helmet' {
  import { RequestHandler } from 'express';

  interface HelmetOptions {
    contentSecurityPolicy?: boolean | object;
    crossOriginEmbedderPolicy?: boolean;
    crossOriginResourcePolicy?: { policy: string };
    frameguard?: boolean | object;
    hsts?: boolean | object;
    ieNoOpen?: boolean;
    noSniff?: boolean;
    referrerPolicy?: boolean | object;
    xssFilter?: boolean;
  }

  function helmet(options?: HelmetOptions): RequestHandler;
  export = helmet;
}

declare module 'express-rate-limit' {
  import { Request, Response, NextFunction } from 'express';

  interface RateLimitOptions {
    windowMs?: number;
    max?: number | ((req: Request, res: Response) => number | Promise<number>);
    message?: string | object;
    statusCode?: number;
    legacyHeaders?: boolean;
    standardHeaders?: boolean;
    requestPropertyName?: string;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request, res: Response) => string;
    handler?: (req: Request, res: Response, next: NextFunction) => void;
    skip?: (req: Request, res: Response) => boolean | Promise<boolean>;
    store?: any;
  }

  interface RateLimit {
    resetTime?: Date;
    limit?: number;
    current?: number;
    remaining?: number;
  }

  function rateLimit(options?: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
  export = rateLimit;
}
