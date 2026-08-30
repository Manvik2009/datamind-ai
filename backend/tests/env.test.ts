import { describe, it, expect } from 'vitest';
import { getEnv } from '../src/config/env.js';

describe('Environment configuration', () => {
  it('should have default backend port', () => {
    const env = getEnv();
    expect(env.PORT).toBeGreaterThan(0);
  });

  it('should have default frontend URL', () => {
    const env = getEnv();
    expect(env.FRONTEND_URL).toContain('localhost');
  });

  it('should have NODE_ENV defined', () => {
    const env = getEnv();
    expect(['development', 'test', 'production']).toContain(env.NODE_ENV);
  });
});
