/**
 * Google Gemini provider adapter.
 * Server-side only — never imported in browser code.
 *
 * Required env: GEMINI_API_KEY
 * Optional env: GEMINI_MODEL (defaults to gemini-3-flash-preview)
 *
 * Uses the Gemini generateContent REST API directly (no SDK dependency).
 */

import type { AIProvider, AIValidationInput, AIValidationResult } from "./types";
import { getPoints } from "@/lib/scoring";
import type { RarityTier } from "@/lib/types";

const VALID_RARITY_TIERS: RarityTier[] = [
  "the-hit", "radio-rotation", "b-side", "crate-find", "cult-favourite", "deep-vault",
];

const SYSTEM_INSTRUCTION = `You are the answer-validation engine for SIDE B, an Indian culture and global pop-culture trivia game.

Your job is to determine whether a player's answer satisfies the given question prompt, then estimate its rarity.

RARITY TIERS (use these exact ids):
- the-hit: very commonly known answer
- radio-rotation: commonly known  
- b-side: less obvious, enthusiasts know it
- crate-find: uncommon, known to serious followers
- cult-favourite: rare, dedicated community knowledge
- deep-vault: exceptional obscurity

Rules:
1. Validate strictly against the inclusion criteria.
2. Be generous with spelling, transliteration, and alternate titles — if it is clearly the same thing, accept it.
3. Do not accept answers that are technically adjacent but do not actually satisfy the prompt.
4. Assign rarity based on how well-known this answer is relative to OTHER valid answers to this specific question.
5. If uncertain, set needsReview: true and confidence: "low".
6. ONLY respond with valid JSON. No markdown, no prose, just the JSON object.`;

function buildPrompt(input: AIValidationInput): string {
  return `QUESTION: "${input.prompt}"
CATEGORY: ${input.category}${input.inclusionCriteria ? `\nINCLUSION CRITERIA: ${input.inclusionCriteria}` : ""}
PLAYER'S ANSWER: "${input.guess}"

Respond with ONLY this JSON object (no markdown):
{
  "isValid": boolean,
  "canonicalAnswer": "the correct canonical name (or the submitted guess if invalid)",
  "confidence": "high" | "medium" | "low",
  "reason": "one short sentence",
  "rarityTier": "the-hit" | "radio-rotation" | "b-side" | "crate-find" | "cult-favourite" | "deep-vault" | null,
  "needsReview": boolean
}`;
}

function parseResponse(raw: string, input: AIValidationInput): AIValidationResult {
  let parsed: Record<string, unknown>;
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini response was not valid JSON: ${raw.slice(0, 200)}`);
  }

  const isValid = Boolean(parsed.isValid);
  const canonicalAnswer = typeof parsed.canonicalAnswer === "string" ? parsed.canonicalAnswer : input.guess;
  const confidence =
    parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
      ? parsed.confidence : "low";
  const reason = typeof parsed.reason === "string" ? parsed.reason : "";
  const rawRarity = parsed.rarityTier as string | null;
  const rarityTier: RarityTier | null =
    rawRarity && VALID_RARITY_TIERS.includes(rawRarity as RarityTier)
      ? (rawRarity as RarityTier) : null;
  const points = isValid && rarityTier ? getPoints(rarityTier) : 0;
  const needsReview = Boolean(parsed.needsReview);

  return { isValid, canonicalAnswer, confidence, reason, rarityTier, points, needsReview, source: "ai" };
}

export function createGeminiProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  return {
    name: () => "gemini",
    isAvailable: () => Boolean(apiKey),

    async validate(input: AIValidationInput): Promise<AIValidationResult> {
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${baseUrl}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ parts: [{ text: buildPrompt(input) }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 300,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof content !== "string") {
          throw new Error("Unexpected Gemini response structure");
        }

        return parseResponse(content, input);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
