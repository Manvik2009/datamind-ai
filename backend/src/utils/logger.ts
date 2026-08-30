import { getEnv } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  const env = getEnv();
  const currentLevel = LOG_LEVELS[env.LOG_LEVEL || 'info'];
  return LOG_LEVELS[level] >= currentLevel;
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.info(formatLog('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, meta));
    }
  },
};
