import { LLMProvider } from '../schemas/provider.js';

export class MockAIProvider implements LLMProvider {
  name = 'mock';

  async generate(prompt: string, _context: Record<string, unknown>): Promise<string> {
    return `[Mock AI Response]\n\nBased on the analysis, here is a simulated explanation.\n\nPrompt preview: ${prompt.slice(0, 200)}...`;
  }

  async generateStructured<T>(_prompt: string, _schema: unknown, _context: Record<string, unknown>): Promise<T> {
    return {
      answer: 'This is a mock structured response. Configure an AI provider to get real results.',
      insights: [],
      evidence: [],
      limitations: ['Mock provider does not provide real AI analysis'],
      tools_used: [],
    } as T;
  }
}
