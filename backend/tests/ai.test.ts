import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('AI endpoints', () => {
  it('POST /api/ai/datasets/:id/summary should return 404 for nonexistent dataset', async () => {
    const response = await request(app).post('/api/ai/datasets/nonexistent-id/summary');
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/ai/datasets/:id/data-quality should return 404 for nonexistent dataset', async () => {
    const response = await request(app).post('/api/ai/datasets/nonexistent-id/data-quality');
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/ai/experiments/:id/explain should return 404 for nonexistent experiment', async () => {
    const response = await request(app).post('/api/ai/experiments/nonexistent-id/explain');
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/ai/query without body should return 400', async () => {
    const response = await request(app).post('/api/ai/query').send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/ai/query with missing fields should return 400', async () => {
    const response = await request(app).post('/api/ai/query').send({ dataset_id: 'test' });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
