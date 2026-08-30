import { AIConfig, DEFAULT_AI_CONFIG } from '../schemas/config.js';
import { LLMProvider } from '../schemas/provider.js';
import { MockAIProvider } from './mock.provider.js';

class AIProviderFactory {
  private static instance: LLMProvider | null = null;

  static getProvider(config: Partial<AIConfig> = {}): LLMProvider {
    if (this.instance) {
      return this.instance;
    }

    const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config };
    const provider = mergedConfig.provider;

    if (provider === 'mock' || !mergedConfig.apiKey) {
      this.instance = new MockAIProvider() as unknown as LLMProvider;
      return this.instance;
    }

    if (provider === 'openai') {
      const { OpenAIMockProvider } = require('./openai.provider.js');
      this.instance = new OpenAIMockProvider(mergedConfig) as unknown as LLMProvider;
      return this.instance;
    }

    this.instance = new MockAIProvider() as unknown as LLMProvider;
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

export { AIProviderFactory };
