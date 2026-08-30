import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { mockSupabase, singleMock, maybeSingleMock } from './setup';

describe('Dataset endpoints', () => {
  let app: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    singleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    maybeSingleMock.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    const mod = await import('../src/index.js');
    app = mod.default;
  });

  it('GET /api/datasets should return empty list', async () => {
    const response = await request(app).get('/api/datasets');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
  });

  it('GET /api/datasets/:id should return 404', async () => {
    const response = await request(app).get('/api/datasets/nonexistent-id');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error?.code).toBe('NOT_FOUND');
  });

  it('DELETE /api/datasets/:id should return 404', async () => {
    const response = await request(app).delete('/api/datasets/nonexistent-id');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
