import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecisionService } from '../src/services/decisionService.js';
import { JobService } from '../src/services/jobService.js';
import { getSupabase } from '../src/config/supabase.js';

vi.mock('../src/config/supabase.js', () => ({
  getSupabase: vi.fn(),
}));

describe('DecisionService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    (getSupabase as any).mockReturnValue(mockSupabase);
  });

  describe('validatePredictionInput', () => {
    it('should reject when experiment not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const result = await DecisionService.validatePredictionInput(
        'dataset-id',
        'experiment-id',
        'model-id',
        { feature1: 1 }
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Experiment not found or does not belong to the specified dataset');
    });

    it('should reject when model not found', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'exp-id', selected_features: ['feature1'] },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const result = await DecisionService.validatePredictionInput(
        'dataset-id',
        'experiment-id',
        'model-id',
        { feature1: 1 }
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model not found or does not belong to the specified experiment');
    });

    it('should reject unknown features', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'exp-id', selected_features: ['feature1'] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'model-id' },
          error: null,
        });

      const result = await DecisionService.validatePredictionInput(
        'dataset-id',
        'experiment-id',
        'model-id',
        { feature1: 1, unknown_feature: 2 }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unknown features'))).toBe(true);
    });

    it('should reject missing required features', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'exp-id', selected_features: ['feature1', 'feature2'] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'model-id' },
          error: null,
        });

      const result = await DecisionService.validatePredictionInput(
        'dataset-id',
        'experiment-id',
        'model-id',
        { feature1: 1 }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Missing required features'))).toBe(true);
    });

    it('should accept valid input', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'exp-id', selected_features: ['feature1'] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'model-id' },
          error: null,
        });

      const result = await DecisionService.validatePredictionInput(
        'dataset-id',
        'experiment-id',
        'model-id',
        { feature1: 1 }
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null values', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'exp-id', selected_features: ['feature1'] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'model-id' },
          error: null,
        });

      const result = await DecisionService.validatePredictionInput(
        'dataset-id',
        'experiment-id',
        'model-id',
        { feature1: null }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('null or undefined'))).toBe(true);
    });
  });

  describe('getDecisionFactors', () => {
    it('should return empty factors when experiment not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      await expect(DecisionService.getDecisionFactors('nonexistent-id')).rejects.toThrow('Experiment not found');
    });
  });
});

describe('JobService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    (getSupabase as any).mockReturnValue(mockSupabase);
  });

  it('should create a job', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: 'job-1', job_type: 'batch_prediction', status: 'QUEUED' },
      error: null,
    });

    const job = await JobService.createJob('batch_prediction', 'dataset-id', 'exp-id', 'model-id');
    expect(job.id).toBe('job-1');
    expect(job.status).toBe('QUEUED');
  });

  it('should cancel a queued job', async () => {
    let callCount = 0;
    mockSupabase.single.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: { id: 'job-1', status: 'QUEUED' }, error: null });
      }
      return Promise.resolve({ data: { started_at: null }, error: null });
    });

    const result = await JobService.cancelJob('job-1');
    expect(result).toBe(true);
  });

  it('should not cancel a completed job', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: 'job-1', status: 'COMPLETED' },
      error: null,
    });

    const result = await JobService.cancelJob('job-1');
    expect(result).toBe(false);
  });
});
