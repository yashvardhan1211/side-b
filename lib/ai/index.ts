/**
 * AI provider factory — server-side only.
 * Returns the best available provider based on environment configuration.
 * Falls back to the mock provider if no real provider is configured.
 */
export { mockProvider } from "./mock-provider";
export { createOpenAIProvider } from "./openai-provider";
export type { AIProvider, AIValidationInput, AIValidationResult } from "./types";
