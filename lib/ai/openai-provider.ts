/**
 * OpenAI provider adapter.
 * Only instantiated on the server — never imported in browser code.
 *
 * Required env: OPENAI_API_KEY (set in .env.local — never in client code)
 * Optional env: OPENAI_MODEL (defaults to "gpt-4o-mini" for cost efficiency)
 *
 * Returns structured JSON matching AIValidationResult. Validates the response
 * schema before accepting it. Handles timeouts and malformed responses.
 */

import type { AIProvider, AIValidationInput, AIValidationResult } from "./types";
import { getPoints } from "@/lib/scoring";
import { AI_FALLBACK_RARITY } from "@/lib/config";
import type { RarityTier } from "@/lib/types";

const VALID_RARITY_TIERS: RarityTier[] = [
  "the-hit",
  "radio-rotation",
  "b-side",
  "crate-find",
  "cult-favourite",
  "deep-vault",
];

const SYSTEM_PROMPT = `You are the answer-validation engine for SIDE B, an Indian culture trivia game.

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
2. Be generous with spelling, transliteration, and alternate titles — if it's clearly the same thing, accept it.
3. Do not accept answers that are technically adjacent but don't actually satisfy the prompt.
4. Assign rarity based on how well-known this answer is relative to OTHER valid answers to this specific question, not just in general.
5. If you are uncertain, set needsReview: true and confidence: "low".

You MUST respond with valid JSON only. No markdown, no prose, just the JSON object.`;

function buildUserPrompt(input: AIValidationInput): string {
  return `QUESTION: "${input.prompt}"
CATEGORY: ${input.category}${input.inclusionCriteria ? `\nINCLUSION CRITERIA: ${input.inclusionCriteria}` : ""}
PLAYER'S ANSWER: "${input.guess}"

Respond with a JSON object:
{
  "isValid": boolean,
  "canonicalAnswer": "the correct canonical name for this answer (or the submitted guess if invalid)",
  "confidence": "high" | "medium" | "low",
  "reason": "one short sentence",
  "rarityTier": "the-hit" | "radio-rotation" | "b-side" | "crate-find" | "cult-favourite" | "deep-vault" | null,
  "needsReview": boolean
}`;
}

function parseResponse(raw: string, input: AIValidationInput): AIValidationResult {
  let parsed: Record<string, unknown>;
  try {
    // Strip potential markdown code fences
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI response was not valid JSON: ${raw.slice(0, 200)}`);
  }

  const isValid = Boolean(parsed.isValid);
  const canonicalAnswer =
    typeof parsed.canonicalAnswer === "string" ? parsed.canonicalAnswer : input.guess;
  const confidence =
    parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
      ? parsed.confidence
      : "low";
  const reason = typeof parsed.reason === "string" ? parsed.reason : "";
  const rawRarity = parsed.rarityTier as string | null;
  const rarityTier: RarityTier | null =
    rawRarity && VALID_RARITY_TIERS.includes(rawRarity as RarityTier)
      ? (rawRarity as RarityTier)
      : null;
  const points = isValid && rarityTier ? getPoints(rarityTier) : 0;
  const needsReview = Boolean(parsed.needsReview);

  return {
    isValid,
    canonicalAnswer,
    confidence,
    reason,
    rarityTier,
    points,
    needsReview,
    source: "ai",
  };
}

export function createOpenAIProvider(): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  return {
    name: () => "openai",

    isAvailable: () => Boolean(apiKey),

    async validate(input: AIValidationInput): Promise<AIValidationResult> {
      if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: buildUserPrompt(input) },
            ],
            temperature: 0.1,  // low temperature for deterministic validation
            max_tokens: 200,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`OpenAI API error ${response.status}: ${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== "string") {
          throw new Error("Unexpected OpenAI response structure");
        }

        return parseResponse(content, input);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
