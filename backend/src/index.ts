import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getEnv, validateProductionEnv, isProduction, isTest } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import healthRoutes from './routes/healthRoutes.js';
import datasetRoutes from './routes/datasetRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import aiRoutes from './ai/ai.routes.js';
import decisionRoutes from './routes/decisionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { logger } from './utils/logger.js';

validateProductionEnv();

const app = express();
const env = getEnv();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: isProduction() ? undefined : false,
  crossOriginEmbedderPolicy: isProduction(),
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
  'https://datamind-ai-platform.web.app',
  'https://datamind-ai-platform.firebaseapp.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(requestIdMiddleware);

app.use('/api', generalLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

export default app;

if (!isTest()) {
  const server = app.listen(env.PORT, () => {
    logger.info(`DataMind API running on port ${env.PORT}`, {
      environment: env.NODE_ENV,
      port: env.PORT,
    });
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { error: String(reason) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}
