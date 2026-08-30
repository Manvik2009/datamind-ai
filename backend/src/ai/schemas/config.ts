export const AI_PROVIDERS = {
  openai: 'openai',
  anthropic: 'anthropic',
  mock: 'mock',
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: AI_PROVIDERS.mock,
  apiKey: '',
  model: 'mock-model',
  maxTokens: 1024,
  temperature: 0.2,
  timeout: 30000,
};
