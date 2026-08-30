import { vi } from 'vitest';

vi.mock('helmet', () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

const singleMock = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

const createBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: singleMock,
  maybeSingle: maybeSingleMock,
});

const mockSupabase = {
  from: vi.fn(() => createBuilder()),
};

vi.mock('../src/config/supabase.js', () => ({
  getSupabase: () => mockSupabase,
  supabase: mockSupabase,
  resetSupabase: vi.fn(),
  setSupabaseClient: vi.fn(),
}));

export { mockSupabase, singleMock, maybeSingleMock };
