/**
 * POST /api/generate-edition
 *
 * AI-powered daily edition generator.
 * Call this once per day (via cron or manually) to generate a fresh edition.
 *
 * The AI generates 5 questions, each with:
 *  - A prompt with a clear scope
 *  - 8-12 accepted answers spanning all rarity tiers
 *  - Aliases for common spelling variants
 *  - Per-answer context notes
 *  - An editorial explanation
 *
 * Body: { date: "YYYY-MM-DD", secret: string }
 * Returns: DailyEdition JSON
 *
 * Secure this endpoint with GENERATION_SECRET env var in production.
 */

import { NextResponse } from "next/server";
import type { DailyEdition, MultiAnswerQuestion, AcceptedAnswer, RarityTier } from "@/lib/types";
import { RARITY_CONFIG } from "@/lib/config";

const GENERATION_SECRET = process.env.GENERATION_SECRET ?? "sideb-dev";

// ─── Content categories to rotate through ────────────────────────
const CATEGORY_POOL = [
  "Gaming",
  "Music",
  "Streaming",
  "Indian Music",
  "Indian Internet",
  "Anime",
  "Sports",
  "Films",
  "Brands",
  "Tech",
  "Food",
  "Internet",
];

const EDITION_THEMES = [
  "Start here.",
  "Level two.",
  "The deep cuts.",
  "Same curiosity.",
  "The B-side.",
  "Flip it over.",
  "Beyond the obvious.",
  "Keep digging.",
  "Off the charts.",
  "Hidden tracks.",
];

// ─── System prompt for GPT ────────────────────────────────────────
const SYSTEM_PROMPT = `You are the question designer for SIDE B, an Indian culture and global pop-culture trivia game.

The game mechanic: Players have 25 seconds to name as many valid answers to a prompt as possible. Each answer has its own rarity tier — common answers score less, rare answers score more.

RARITY TIERS (assign these to each answer):
- the-hit: 100 pts — everyone names this first
- radio-rotation: 200 pts — most players will get it
- b-side: 350 pts — needs some thought
- crate-find: 500 pts — enthusiast knowledge
- cult-favourite: 700 pts — dedicated fan knowledge  
- deep-vault: 1000 pts — exceptionally obscure

GOOD QUESTION CRITERIA:
1. Must have 8-15 valid answers across all rarity tiers
2. Entry point must be instantly obvious (at least 3 "the-hit" answers)
3. Must be answerable in 25 seconds — players need to rattle off answers
4. Must appeal to 18-24 year olds in India
5. Mix Indian and global culture
6. Clear inclusion/exclusion criteria — no ambiguity

QUESTION FORMATS THAT WORK WELL:
- "Name a Pokémon" (huge answer space, instant recognition)
- "Name an artist with 1B+ Spotify streams"
- "Name a Netflix original series"
- "Name a superhero film"
- "Name an IPL team"
- "Name a battle royale game"
- "Name a fast food chain in India"
- "Name an anime series"
- "Name a sneaker brand"
- "Name an Indian creator with 1M+ followers"

QUESTION FORMATS TO AVOID:
- Single-answer trivia ("Which film won...")
- Award-specific questions ("Name a film that won X award at Y ceremony")
- Hyper-niche festivals or events
- Questions requiring specialist knowledge just to start

AUDIENCE: 18-24, Indian college students and young professionals who use Instagram, YouTube, Spotify, watch Netflix, play mobile games, follow IPL and global football.

You MUST respond with valid JSON only — no markdown, no prose, just the JSON.`;

function buildGenerationPrompt(date: string, categories: string[]): string {
  return `Generate a SIDE B Daily Cut edition for date: ${date}

Create exactly 5 questions. Use these categories (one per question): ${categories.join(", ")}

For each question, provide 8-12 accepted answers spanning all rarity tiers. At least 3 answers must be "the-hit" (100 pts) — obvious answers players will name immediately.

Respond with this exact JSON structure:
{
  "title": "short editorial title (3-5 words)",
  "description": "one sentence describing the edition",
  "questions": [
    {
      "id": "unique-id-like-2026-10-19-q1",
      "prompt": "Name a ...",
      "category": "Category",
      "intro": "optional 1-sentence flavour text or null",
      "inclusionCriteria": "what counts as a valid answer",
      "hint": "a nudge without giving it away",
      "explanation": "2-3 sentences of editorial context shown after the round",
      "acceptedAnswers": [
        {
          "id": "kebab-case-id",
          "display": "Canonical Display Name",
          "aliases": ["alternate spelling", "common abbreviation"],
          "rarity": "the-hit",
          "points": 100,
          "context": "one sentence shown on reveal"
        }
      ]
    }
  ]
}

Make the questions varied — different subjects, different difficulty feels. The first question should be the most accessible (widest answer space). Include at least one India-specific question and one global pop culture question.`;
}

// ─── Parse + validate GPT response ───────────────────────────────
function parseEdition(raw: string, date: string): DailyEdition {
  let parsed: Record<string, unknown>;
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Invalid JSON from AI: ${raw.slice(0, 300)}`);
  }

  const questions = (parsed.questions as unknown[]).map((q: unknown, qi) => {
    const question = q as Record<string, unknown>;
    const answers = (question.acceptedAnswers as unknown[]).map((a: unknown) => {
      const ans = a as Record<string, unknown>;
      const rarity = ans.rarity as string;
      if (!RARITY_CONFIG[rarity]) {
        throw new Error(`Unknown rarity tier: ${rarity}`);
      }
      const answer: AcceptedAnswer = {
        id: String(ans.id),
        display: String(ans.display),
        aliases: Array.isArray(ans.aliases) ? ans.aliases.map(String) : [],
        rarity: rarity as RarityTier,
        points: RARITY_CONFIG[rarity].points, // always use config points, ignore AI-provided
        context: ans.context ? String(ans.context) : undefined,
        provisional: true,
      };
      return answer;
    });

    const mq: MultiAnswerQuestion = {
      id: String(question.id || `${date}-q${qi + 1}`),
      prompt: String(question.prompt),
      category: String(question.category),
      intro: question.intro ? String(question.intro) : undefined,
      inclusionCriteria: question.inclusionCriteria ? String(question.inclusionCriteria) : undefined,
      hint: question.hint ? String(question.hint) : undefined,
      timeLimitSeconds: 25,
      explanation: String(question.explanation),
      acceptedAnswers: answers,
    };
    return mq;
  });

  const edition: DailyEdition = {
    id: date,
    date,
    title: String(parsed.title || "Today's Cut"),
    description: String(parsed.description || "Five rounds. Name as many as you can."),
    questions,
  };

  return edition;
}

// ─── Route handler ────────────────────────────────────────────────
export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured — cannot generate editions." },
      { status: 503 }
    );
  }

  let body: { date?: string; secret?: string; categories?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Simple secret guard — replace with proper auth in production
  if (body.secret !== GENERATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = body.date ?? new Date().toISOString().split("T")[0];

  // Pick 5 categories — use provided or rotate through pool
  const categories = body.categories ?? pickCategories();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout for generation

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildGenerationPrompt(date, categories) },
        ],
        temperature: 0.8, // slightly higher for creative variety
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `OpenAI error ${response.status}: ${err.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Unexpected OpenAI response" }, { status: 502 });
    }

    const edition = parseEdition(content, date);

    return NextResponse.json({ edition, generatedAt: new Date().toISOString() });
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-edition] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint — preview what today's generation would look like
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== GENERATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = pickCategories();
  const date = new Date().toISOString().split("T")[0];

  return NextResponse.json({
    message: "To generate, POST with { date, secret, categories? }",
    nextDate: date,
    suggestedCategories: categories,
    allCategories: CATEGORY_POOL,
    editionTheme: EDITION_THEMES[Math.floor(Math.random() * EDITION_THEMES.length)],
  });
}

// ─── Pick 5 varied categories ─────────────────────────────────────
function pickCategories(): string[] {
  // Always ensure variety — pick from different buckets
  const gaming = ["Gaming", "Anime"];
  const music = ["Music", "Indian Music"];
  const screen = ["Streaming", "Films"];
  const culture = ["Indian Internet", "Internet", "Sports"];
  const everyday = ["Brands", "Tech", "Food"];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return [
    pick(gaming),
    pick(music),
    pick(screen),
    pick(culture),
    pick(everyday),
  ];
}
