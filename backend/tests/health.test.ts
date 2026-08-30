import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Health endpoint', () => {
  it('should return status ok or degraded', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(['ok', 'degraded']).toContain(response.body.data.status);
    expect(response.body.data.service).toBe('datamind-api');
  });

  it('should return liveness status', async () => {
    const response = await request(app).get('/api/health/live');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('should return readiness status', async () => {
    const response = await request(app).get('/api/health/ready');
    expect([200, 503]).toContain(response.status);
    expect(response.body.success).toBe(true);
    expect(['ok', 'degraded', 'down']).toContain(response.body.data.status);
  });
});
