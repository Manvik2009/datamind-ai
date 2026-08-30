import { describe, it, expect } from 'vitest';
import { AIService } from '../src/ai/ai.service.js';
import { DatasetService } from '../src/services/datasetService.js';
import { MLService } from '../src/services/mlService.js';

describe('AIService', () => {
  it('should generate dataset summary for nonexistent dataset', async () => {
    await expect(AIService.generateDatasetSummary('nonexistent-id')).rejects.toThrow('Dataset not found');
  });

  it('should generate data quality explanation for nonexistent dataset', async () => {
    await expect(AIService.generateDataQualityExplanation('nonexistent-id')).rejects.toThrow('Dataset not found');
  });

  it('should explain ML results for nonexistent experiment', async () => {
    await expect(AIService.explainMLResults('nonexistent-id')).rejects.toThrow('Experiment not found');
  });

  it('should generate insights for nonexistent experiment', async () => {
    await expect(AIService.generateInsights('nonexistent-id')).rejects.toThrow('Experiment not found');
  });

  it('should query data for nonexistent dataset', async () => {
    await expect(AIService.queryData('nonexistent-id', 'test question')).rejects.toThrow('Dataset not found');
  });
});
