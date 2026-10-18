/**
 * Mock AI provider for local development and automated tests.
 *
 * Simulates realistic latency, returns plausible-looking structured responses,
 * and handles the "always invalid but politely so" scenario for truly unknown answers.
 *
 * This provider is used when no real AI provider is configured.
 * It is clearly labeled as mock — callers can check provider.name() === "mock".
 */

import type { AIProvider, AIValidationInput, AIValidationResult } from "./types";
import { AI_FALLBACK_RARITY } from "@/lib/config";

// Simulate network latency: 150–350ms
function simulateLatency(): Promise<void> {
  const ms = 150 + Math.floor(Math.random() * 200);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Very basic heuristic used only when no real AI is available.
 * This is intentionally conservative — it returns "needsReview: true"
 * for anything uncertain rather than accepting dubious answers.
 *
 * In a real deployment this function is never called; the AI provider takes over.
 */
function heuristicValidate(input: AIValidationInput): AIValidationResult {
  const guess = input.guess.trim();

  // Reject obviously too-short answers
  if (guess.length < 2) {
    return {
      isValid: false,
      canonicalAnswer: guess,
      confidence: "high",
      reason: "Answer is too short to be meaningful.",
      rarityTier: null,
      points: 0,
      needsReview: false,
      source: "ai",
    };
  }

  // The mock cannot actually validate cultural knowledge — it declines.
  // This is the correct honest behavior for a mock provider.
  return {
    isValid: false,
    canonicalAnswer: guess,
    confidence: "low",
    reason:
      "This answer is not in the curated bank and no AI provider is configured. " +
      "In demo mode, only answers from the curated bank are accepted.",
    rarityTier: null,
    points: 0,
    needsReview: true,
    source: "ai",
  };
}

export const mockProvider: AIProvider = {
  name: () => "mock",

  isAvailable: () => true, // always available (for offline dev)

  async validate(input: AIValidationInput): Promise<AIValidationResult> {
    await simulateLatency();
    return heuristicValidate(input);
  },
};
