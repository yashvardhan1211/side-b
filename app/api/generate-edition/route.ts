/**
 * POST /api/generate-edition
 *
 * AI-powered daily edition generator using Gemini.
 * Generates 5 fresh questions with full answer banks, rarity tiers, and context.
 *
 * Body: { date?: "YYYY-MM-DD", secret: string }
 * Returns: { edition: DailyEdition, generatedAt: string }
 *
 * Secured by GENERATION_SECRET env var.
 */

import { NextResponse } from "next/server";
import type { DailyEdition, MultiAnswerQuestion, AcceptedAnswer, RarityTier } from "@/lib/types";
import { RARITY_CONFIG } from "@/lib/config";
import { getTodayEditionId } from "@/lib/date";

const GENERATION_SECRET = process.env.GENERATION_SECRET ?? "sideb-dev";

const SYSTEM_PROMPT = `You are the head question writer for SIDE B, a daily rarity trivia game for 18-24 year olds in India.

The mechanic: Players have 25 seconds to name as many valid answers as possible. Each answer has a rarity tier — common answers score less, rare ones score more. The game feels like a speed round where players shout out answers.

RARITY TIERS:
- the-hit: 100 pts — first answer everyone says (need at least 3-4 per question)
- radio-rotation: 200 pts — most players get this with a second of thought
- b-side: 350 pts — takes a bit of digging
- crate-find: 500 pts — enthusiast territory
- cult-favourite: 700 pts — dedicated fan knowledge
- deep-vault: 1000 pts — almost nobody gets this

RULES FOR GREAT QUESTIONS:
1. Must have 8-14 valid answers spanning all tiers
2. Must have at least 3 "the-hit" answers — players need an easy entry point
3. Players must be able to start answering in 1 second — no obscure premise
4. Audience: Indian college students who use Instagram, YouTube, Netflix, Spotify, play games, follow IPL and football
5. Mix Indian and global culture across the 5 questions
6. Questions like "Name a Pokémon", "Name an IPL team", "Name a Netflix show", "Name a superhero" work great
7. AVOID single-answer trivia, award-specific questions, or anything requiring specialist knowledge just to START

RESPOND WITH VALID JSON ONLY. No markdown, no explanation, just the JSON.`;

function buildPrompt(date: string): string {
  const dayName = new Date(date).toLocaleDateString("en-IN", { weekday: "long" });
  return `Generate a SIDE B Daily Cut edition for ${dayName}, ${date}.

Create exactly 5 varied questions. Mix these vibes:
- 1 gaming/anime question (huge answer space)
- 1 music question (Indian or global, contemporary)  
- 1 streaming/films question
- 1 Indian culture/internet/sports question
- 1 everyday brands/food/tech question

Each question needs 8-14 accepted answers spanning all rarity tiers.

Return this exact JSON:
{
  "title": "3-5 word editorial title",
  "description": "one punchy sentence",
  "questions": [
    {
      "id": "${date}-q1",
      "prompt": "Name a ...",
      "category": "Category",
      "intro": "optional 1-sentence flavour or null",
      "inclusionCriteria": "exact criteria for what counts",
      "hint": "nudge without giving it away",
      "explanation": "2-3 sentences of context shown after the round",
      "acceptedAnswers": [
        {
          "id": "kebab-case-unique-id",
          "display": "Canonical Name",
          "aliases": ["alt spelling", "abbreviation"],
          "rarity": "the-hit",
          "points": 100,
          "context": "one sentence shown on reveal"
        }
      ]
    },
    { "id": "${date}-q2", ... },
    { "id": "${date}-q3", ... },
    { "id": "${date}-q4", ... },
    { "id": "${date}-q5", ... }
  ]
}

Make it fresh, fun, and culturally relevant. The Pokémon question always works — but try something different today.`;
}

function parseEdition(raw: string, date: string): DailyEdition {
  let parsed: Record<string, unknown>;
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Invalid JSON from Gemini: ${raw.slice(0, 300)}`);
  }

  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  if (rawQuestions.length === 0) throw new Error("No questions in generated edition");

  const questions: MultiAnswerQuestion[] = rawQuestions.map((q: unknown, qi: number) => {
    const question = q as Record<string, unknown>;
    const rawAnswers = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];

    const answers: AcceptedAnswer[] = rawAnswers.map((a: unknown) => {
      const ans = a as Record<string, unknown>;
      const rarity = String(ans.rarity ?? "b-side") as RarityTier;
      const validRarity = RARITY_CONFIG[rarity] ? rarity : "b-side";
      return {
        id: String(ans.id ?? `${date}-q${qi + 1}-a${Math.random().toString(36).slice(2, 6)}`),
        display: String(ans.display ?? ""),
        aliases: Array.isArray(ans.aliases) ? ans.aliases.map(String) : [],
        rarity: validRarity as RarityTier,
        points: RARITY_CONFIG[validRarity].points, // always use config, never trust AI points
        context: ans.context ? String(ans.context) : undefined,
        provisional: true,
      };
    }).filter((a) => a.display); // drop any blank answers

    return {
      id: String(question.id ?? `${date}-q${qi + 1}`),
      prompt: String(question.prompt ?? ""),
      category: String(question.category ?? "General"),
      intro: question.intro && question.intro !== "null" ? String(question.intro) : undefined,
      inclusionCriteria: question.inclusionCriteria ? String(question.inclusionCriteria) : undefined,
      hint: question.hint ? String(question.hint) : undefined,
      timeLimitSeconds: 25,
      explanation: String(question.explanation ?? ""),
      acceptedAnswers: answers,
    };
  });

  return {
    id: date,
    date,
    title: String(parsed.title ?? "Today's Cut"),
    description: String(parsed.description ?? "Five rounds. Name as many as you can in 25 seconds."),
    questions,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  let body: { date?: string; secret?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  if (body.secret !== GENERATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = body.date ?? getTodayEditionId();
  const model = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: buildPrompt(date) }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 8000 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return NextResponse.json({ error: `Gemini error ${res.status}: ${err.slice(0, 300)}` }, { status: 502 });
    }

    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Unexpected Gemini response structure", raw: data }, { status: 502 });
    }

    const edition = parseEdition(content, date);
    return NextResponse.json({ edition, generatedAt: new Date().toISOString(), model });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-edition]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== GENERATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    info: "POST with { secret, date? } to generate a fresh edition",
    today: getTodayEditionId(),
    model: process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
}
