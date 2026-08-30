import { describe, it, expect, vi } from 'vitest';
import { MLService } from '../src/services/mlService.js';
import { singleMock } from './setup.js';

describe('MLService', () => {
  it('should create experiment with correct structure', async () => {
    singleMock.mockResolvedValue({
      data: {
        id: 'test-id',
        dataset_id: 'test-dataset-id',
        name: 'Test Experiment',
        target_column: 'target',
        status: 'QUEUED',
      },
      error: null,
    });

    const experiment = await MLService.createExperiment('test-dataset-id', {
      name: 'Test Experiment',
      target_column: 'target',
      problem_type: 'binary_classification',
      test_size: 0.2,
      random_seed: 42,
    });

    expect(experiment).toBeDefined();
    expect(experiment.dataset_id).toBe('test-dataset-id');
    expect(experiment.target_column).toBe('target');
    expect(experiment.status).toBe('QUEUED');
  });
});
