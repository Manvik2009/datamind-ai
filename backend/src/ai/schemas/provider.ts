export interface LLMProvider {
  name: string;
  generate(prompt: string, context: Record<string, unknown>): Promise<string>;
  generateStructured<T>(prompt: string, schema: unknown, context: Record<string, unknown>): Promise<T>;
}
