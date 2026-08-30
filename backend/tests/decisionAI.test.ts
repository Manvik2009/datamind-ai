import { describe, it, expect, vi } from 'vitest';
import { AIService } from '../src/ai/ai.service.js';
import { AI_TOOLS, getAllowedTools, getToolByName } from '../src/ai/tools/registry.js';

describe('AI Tool Registry - Decision Tools', () => {
  it('should include run_prediction tool', () => {
    const tool = getToolByName('run_prediction');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('run_prediction');
  });

  it('should include run_batch_prediction tool', () => {
    const tool = getToolByName('run_batch_prediction');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('run_batch_prediction');
  });

  it('should include run_scenario tool', () => {
    const tool = getToolByName('run_scenario');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('run_scenario');
  });

  it('should include compare_scenarios tool', () => {
    const tool = getToolByName('compare_scenarios');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('compare_scenarios');
  });

  it('should include run_sensitivity_analysis tool', () => {
    const tool = getToolByName('run_sensitivity_analysis');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('run_sensitivity_analysis');
  });

  it('should include get_prediction_distribution tool', () => {
    const tool = getToolByName('get_prediction_distribution');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('get_prediction_distribution');
  });

  it('should include get_decision_factors tool', () => {
    const tool = getToolByName('get_decision_factors');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('get_decision_factors');
  });

  it('should have at least 12 tools total', () => {
    expect(AI_TOOLS.length).toBeGreaterThanOrEqual(12);
  });

  it('should allow decision tools with proper context', () => {
    const context = { dataset_id: 'ds-1', experiment_id: 'exp-1' };
    const allowedTools = getAllowedTools(context);
    const toolNames = allowedTools.map((t) => t.name);

    expect(toolNames).toContain('run_prediction');
    expect(toolNames).toContain('run_batch_prediction');
    expect(toolNames).toContain('run_scenario');
    expect(toolNames).toContain('compare_scenarios');
    expect(toolNames).toContain('run_sensitivity_analysis');
    expect(toolNames).toContain('get_prediction_distribution');
    expect(toolNames).toContain('get_decision_factors');
  });

  it('should require both dataset_id and experiment_id for run_prediction', () => {
    const tool = getToolByName('run_prediction');
    expect(tool?.authorize({ dataset_id: 'ds-1' })).toBe(false);
    expect(tool?.authorize({ experiment_id: 'exp-1' })).toBe(false);
    expect(tool?.authorize({ dataset_id: 'ds-1', experiment_id: 'exp-1' })).toBe(true);
  });

  it('should validate tool input schemas', () => {
    const tool = getToolByName('run_prediction');
    const schema = tool?.input_schema as any;
    expect(schema.required).toContain('dataset_id');
    expect(schema.required).toContain('experiment_id');
    expect(schema.required).toContain('model_id');
    expect(schema.required).toContain('input_data');
  });
});

describe('AIService - Decision Analysis', () => {
  it('should throw error for nonexistent experiment in analyzeDecisionFactors', async () => {
    await expect(
      AIService.analyzeDecisionFactors('ds-id', 'nonexistent-exp', 'test question')
    ).rejects.toThrow('Experiment not found');
  });

  it('should throw error for nonexistent dataset in generateRecommendations', async () => {
    const { MLService } = await import('../src/services/mlService.js');
    vi.spyOn(MLService, 'getExperiment').mockResolvedValueOnce(null);

    await expect(
      AIService.generateRecommendations('ds-id', 'nonexistent-exp')
    ).rejects.toThrow('Experiment not found');
  });

  it('should throw error for nonexistent experiment in generateReport', async () => {
    const { MLService } = await import('../src/services/mlService.js');
    vi.spyOn(MLService, 'getExperiment').mockResolvedValueOnce(null);

    await expect(
      AIService.generateReport('ds-id', 'nonexistent-exp')
    ).rejects.toThrow('Experiment not found');
  });
});

describe('AI Safety Rules', () => {
  it('should have decision explanation prompt with safety disclaimers', async () => {
    const { DECISION_EXPLANATION_PROMPT } = await import('../src/ai/prompts/templates.js');

    expect(DECISION_EXPLANATION_PROMPT).toContain('NEVER claim that a feature "causes"');
    expect(DECISION_EXPLANATION_PROMPT).toContain('NEVER guarantee that a particular action');
    expect(DECISION_EXPLANATION_PROMPT).toContain('model prediction, not a guaranteed outcome');
  });

  it('should have decision analysis prompt with safety rules', async () => {
    const { DECISION_ANALYSIS_PROMPT } = await import('../src/ai/prompts/templates.js');

    expect(DECISION_ANALYSIS_PROMPT).toContain('NEVER convert');
    expect(DECISION_ANALYSIS_PROMPT).toContain('feature causes the outcome');
    expect(DECISION_ANALYSIS_PROMPT).toContain('There is insufficient evidence to make that determination');
  });

  it('should have recommendation prompt with evidence requirements', async () => {
    const { RECOMMENDATION_PROMPT } = await import('../src/ai/prompts/templates.js');

    expect(RECOMMENDATION_PROMPT).toContain('NEVER present recommendations as guaranteed solutions');
    expect(RECOMMENDATION_PROMPT).toContain('ALWAYS identify the supporting evidence');
    expect(RECOMMENDATION_PROMPT).toContain('may help');
  });

  it('should have report prompt with verification rules', async () => {
    const { REPORT_PROMPT } = await import('../src/ai/prompts/templates.js');

    expect(REPORT_PROMPT).toContain('ALL numerical values must come from the verified data');
    expect(REPORT_PROMPT).toContain('model-based scenarios, not guaranteed outcomes');
  });
});
