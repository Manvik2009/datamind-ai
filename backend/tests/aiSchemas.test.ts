import { describe, it, expect } from 'vitest';
import { QueryResponseSchema, InsightSchema } from '../src/ai/schemas/response.js';

describe('AI response schemas', () => {
  it('should validate a valid query response', () => {
    const valid = {
      answer: 'Test answer',
      insights: [],
      evidence: ['evidence1'],
      limitations: ['limitation1'],
      tools_used: ['tool1'],
    };
    const result = QueryResponseSchema.parse(valid);
    expect(result.answer).toBe('Test answer');
    expect(result.tools_used).toContain('tool1');
  });

  it('should reject invalid query response', () => {
    expect(() => QueryResponseSchema.parse({ answer: 123 })).toThrow();
  });

  it('should validate a valid insight', () => {
    const valid = {
      title: 'Test insight',
      severity: 'info',
      category: 'data',
      evidence: ['e1'],
      explanation: 'Explanation text',
      recommendation: 'Recommendation text',
      confidence: 'medium',
    };
    const result = InsightSchema.parse(valid);
    expect(result.severity).toBe('info');
    expect(result.confidence).toBe('medium');
  });

  it('should reject invalid insight severity', () => {
    expect(() => InsightSchema.parse({
      title: 'Test',
      severity: 'invalid',
      category: 'data',
      evidence: [],
      explanation: 'text',
      recommendation: 'text',
      confidence: 'medium',
    })).toThrow();
  });
});
