import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'mock']).default('mock'),
  AI_MODEL: z.string().optional(),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  AI_TIMEOUT: z.coerce.number().int().positive().default(30000),
  PYTHON_SERVICE_URL: z.string().url().default('http://localhost:5001'),
  UPLOAD_DIR: z.string().default('./uploads'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  JWT_SECRET: z.string().min(32).optional(),
  REDIS_URL: z.string().url().optional(),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(200),
  MAX_BATCH_SIZE: z.coerce.number().int().positive().default(10000),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error(`APPLICATION STARTUP FAILED\nEnvironment validation failed:\n${errors}`);
    process.exit(1);
  }

  validatedEnv = result.data;
  return validatedEnv;
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}

export function validateProductionEnv(): void {
  const env = getEnv();

  if (env.NODE_ENV !== 'production') {
    return;
  }

  const required: Array<{ key: keyof Env; description: string }> = [
    { key: 'SUPABASE_URL', description: 'Supabase project URL' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key' },
    { key: 'JWT_SECRET', description: 'JWT signing secret (min 32 chars)' },
  ];

  const missing = required.filter((r) => !env[r.key]);

  if (missing.length > 0) {
    const errorList = missing.map((m) => `  - ${m.key}: ${m.description}`).join('\n');
    console.error(
      `APPLICATION STARTUP FAILED\nMissing required environment variables for production:\n${errorList}`
    );
    process.exit(1);
  }

  if (env.FRONTEND_URL === 'http://localhost:5173') {
    console.warn('WARNING: Using default FRONTEND_URL in production. Set a proper origin.');
  }

  if (env.AI_PROVIDER === 'mock') {
    console.warn('WARNING: Using mock AI provider in production. Set AI_PROVIDER to a real provider.');
  }
}
