/**
 * POST /api/validate
 *
 * Server-side answer validation endpoint.
 * Handles both curated-bank lookup and AI-assisted validation.
 * API keys are NEVER exposed to the browser.
 *
 * Request body: AIValidationRequest (see lib/types.ts)
 * Response body: AIValidationResponse | { error: string }
 *
 * The caller (client game engine) should only reach this endpoint after
 * failing a curated-bank lookup. The server also rechecks the curated bank
 * to prevent the client from bypassing local validation.
 */

import { NextResponse } from "next/server";
import type { AIValidationRequest, AIValidationResponse, DailyEdition } from "@/lib/types";
import { getEditionById } from "@/data/editions";
import { matchAnswer } from "@/lib/validation";
import { getPoints } from "@/lib/scoring";
import { mockProvider, createOpenAIProvider } from "@/lib/ai";
import type { AIProvider } from "@/lib/ai";

// Maximum age for cached AI results (24 hours)
// Server-side we use in-memory cache; client uses localStorage.
const serverCache = new Map<string, AIValidationResponse & { cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCacheKey(questionId: string, normalizedGuess: string): string {
  return `${questionId}::${normalizedGuess}`;
}

function getProvider(): AIProvider {
  if (process.env.OPENAI_API_KEY) {
    return createOpenAIProvider();
  }
  return mockProvider;
}

export async function POST(request: Request): Promise<NextResponse> {
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

  if (typeof guess !== "string" || guess.trim().length === 0) {
    return NextResponse.json({ error: "guess must be a non-empty string" }, { status: 400 });
  }

  // ── 1. Server-side curated bank check ───────────────────────
  // Re-validate locally so the client cannot skip straight to AI scoring
  const { normalize } = await import("@/lib/validation");
  const normalizedGuess = normalize(guess);
  const edition = findEditionForQuestion(questionId);

  if (edition) {
    const question = edition.questions.find((q) => q.id === questionId);
    if (question) {
      const match = matchAnswer(guess, question);
      if (match) {
        // Found in curated bank — return immediately without hitting AI
        const response: AIValidationResponse = {
          isValid: true,
          canonicalAnswer: match.display,
          confidence: "high",
          reason: "Matched the curated answer bank.",
          rarityTier: match.rarity,
          points: match.points,
          needsReview: false,
          source: "ai", // labeled ai for uniform client handling
        };
        return NextResponse.json(response);
      }
    }
  }

  // ── 2. Check server-side cache ───────────────────────────────
  const cacheKey = getCacheKey(questionId, normalizedGuess);
  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    const { cachedAt: _, ...response } = cached;
    return NextResponse.json(response);
  }

  // ── 3. AI validation ─────────────────────────────────────────
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

    // Only cache definitive results (not uncertain ones)
    if (!result.needsReview || result.confidence === "high") {
      serverCache.set(cacheKey, { ...response, cachedAt: Date.now() });
    }

    // Add a header so the client knows which provider was used
    return NextResponse.json(response, {
      headers: {
        "X-SIDEB-AI-Provider": isMock ? "mock" : provider.name(),
        "X-SIDEB-Demo-Mode": isMock ? "true" : "false",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SIDE B validate] AI provider error:", message);

    // Graceful degradation — return a "not valid" result rather than 500
    const fallback: AIValidationResponse = {
      isValid: false,
      canonicalAnswer: guess,
      confidence: "low",
      reason: "Validation unavailable. Only answers from the curated bank work right now.",
      rarityTier: null,
      points: 0,
      needsReview: true,
      source: "ai",
    };
    return NextResponse.json(fallback, {
      status: 200,
      headers: {
        "X-SIDEB-Validation-Error": "true",
        "X-SIDEB-Demo-Mode": "true",
      },
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function findEditionForQuestion(questionId: string) {
  const { SAMPLE_EDITIONS } = require("@/data/editions");
  return (SAMPLE_EDITIONS as DailyEdition[]).find((e) =>
    e.questions.some((q) => q.id === questionId)
  );
}
