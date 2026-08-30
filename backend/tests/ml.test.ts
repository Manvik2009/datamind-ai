import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('ML endpoints', () => {
  it('POST /api/ml without body should return 400', async () => {
    const response = await request(app).post('/api/ml').send({});
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/ml should return empty list', async () => {
    const response = await request(app).get('/api/ml');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
  });

  it('GET /api/ml/:id should return 404 for nonexistent experiment', async () => {
    const response = await request(app).get('/api/ml/nonexistent-id');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('POST /api/ml/:id/train should return 404 for nonexistent experiment', async () => {
    const response = await request(app).post('/api/ml/nonexistent-id/train');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('DELETE /api/ml/:id should return 404 for nonexistent experiment', async () => {
    const response = await request(app).delete('/api/ml/nonexistent-id');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
