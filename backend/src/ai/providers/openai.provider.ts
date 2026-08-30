import { AIProvider, AIConfig } from '../schemas/config.js';

export class OpenAIMockProvider {
  name = 'openai';
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generate(prompt: string, _context: Record<string, unknown>): Promise<string> {
    return `[OpenAI Mock Response for model ${this.config.model}]\n\n${prompt.slice(0, 300)}...`;
  }

  async generateStructured<T>(prompt: string, _schema: unknown, _context: Record<string, unknown>): Promise<T> {
    return {
      answer: `[OpenAI Mock] Analysis based on ${this.config.model}. Configure a real API key for actual results.`,
      insights: [],
      evidence: [],
      limitations: ['Mock provider active'],
      tools_used: [],
    } as T;
  }
}
