import type { RarityTier } from "@/lib/types";

/**
 * Provider-independent interface for the AI validation adapter.
 * Swap the provider without touching game logic.
 */
export interface AIValidationInput {
  questionId: string;
  prompt: string;
  inclusionCriteria?: string;
  category: string;
  guess: string;
}

export interface AIValidationResult {
  isValid: boolean;
  canonicalAnswer: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  rarityTier: RarityTier | null;
  points: number;
  needsReview: boolean;
  source: "ai";
}

export interface AIProvider {
  validate(input: AIValidationInput): Promise<AIValidationResult>;
  isAvailable(): boolean;
  name(): string;
}
