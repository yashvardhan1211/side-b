/**
 * POST /api/validate
 *
 * Server-side answer validation endpoint.
 * API keys are NEVER exposed to the browser.
 *
 * Decision flow:
 * 1. Validate input.
 * 2. Re-run curated bank check server-side (defence in depth).
 * 3. Check server-side in-memory cache.
 * 4. Call AI provider (OpenAI if key present, mock otherwise).
 * 5. Return structured AIValidationResponse.
 */

import { NextResponse } from "next/server";
import type { AIValidationRequest, AIValidationResponse } from "@/lib/types";
import { SAMPLE_EDITIONS } from "@/data/editions";
import { normalize, matchAnswer } from "@/lib/validation";
import { mockProvider, createOpenAIProvider, createGeminiProvider } from "@/lib/ai";
import type { AIProvider } from "@/lib/ai";

// In-process cache — survives across requests in the same serverless instance.
// Client also caches in localStorage to avoid redundant calls.
const serverCache = new Map<string, AIValidationResponse & { cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCacheKey(questionId: string, normalizedGuess: string): string {
  return `${questionId}::${normalizedGuess}`;
}

function getProvider(): AIProvider {
  // Prefer Gemini, fall back to OpenAI, then mock
  if (process.env.GEMINI_API_KEY) return createGeminiProvider();
  if (process.env.OPENAI_API_KEY) return createOpenAIProvider();
  return mockProvider;
}

export async function POST(request: Request): Promise<NextResponse> {
  // ── Parse + validate input ───────────────────────────────────
  let body: AIValidationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { questionId, prompt, inclusionCriteria, category, guess } = body;

  if (!questionId || !prompt || !guess || !category) {
    return NextResponse.json(
      { error: "Missing required fields: questionId, prompt, category, guess" },
      { status: 400 }
    );
  }
  if (typeof guess !== "string" || !guess.trim()) {
    return NextResponse.json({ error: "guess must be a non-empty string" }, { status: 400 });
  }

  const normalizedGuess = normalize(guess);

  // ── 1. Server-side curated bank check ───────────────────────
  const edition = SAMPLE_EDITIONS.find((e) =>
    e.questions.some((q) => q.id === questionId)
  );
  if (edition) {
    const question = edition.questions.find((q) => q.id === questionId);
    if (question) {
      const match = matchAnswer(guess, question);
      if (match) {
        const response: AIValidationResponse = {
          isValid: true,
          canonicalAnswer: match.display,
          confidence: "high",
          reason: "Matched the curated answer bank.",
          rarityTier: match.rarity,
          points: match.points,
          needsReview: false,
          source: "ai",
        };
        return NextResponse.json(response);
      }
    }
  }

  // ── 2. Server-side cache ─────────────────────────────────────
  const cacheKey = getCacheKey(questionId, normalizedGuess);
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    const { cachedAt: _t, ...response } = cached;
    return NextResponse.json(response);
  }

  // ── 3. AI provider ───────────────────────────────────────────
  const provider = getProvider();
  const isMock = provider.name() === "mock";

  try {
    const result = await provider.validate({
      questionId,
      prompt,
      inclusionCriteria,
      category,
      guess,
    });

    const response: AIValidationResponse = {
      isValid: result.isValid,
      canonicalAnswer: result.canonicalAnswer,
      confidence: result.confidence,
      reason: result.reason,
      rarityTier: result.rarityTier,
      points: result.points,
      needsReview: result.needsReview,
      source: "ai",
    };

    if (!result.needsReview || result.confidence === "high") {
      serverCache.set(cacheKey, { ...response, cachedAt: Date.now() });
    }

    return NextResponse.json(response, {
      headers: {
        "X-SIDEB-AI-Provider": isMock ? "mock" : provider.name(),
        "X-SIDEB-Demo-Mode": isMock ? "true" : "false",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SIDE B validate] AI provider error:", message);

    // Graceful degradation — credits exhausted, timeout, etc.
    // Returns a clear "unavailable" signal so the client can distinguish
    // this from a genuine wrong answer.
    const fallback: AIValidationResponse = {
      isValid: false,
      canonicalAnswer: guess,
      confidence: "low",
      reason: "Validation service unavailable.",
      rarityTier: null,
      points: 0,
      needsReview: true,
      source: "ai",
    };
    return NextResponse.json(fallback, {
      headers: {
        "X-SIDEB-Validation-Error": "true",
        "X-SIDEB-Demo-Mode": "true",
      },
    });
  }
}
