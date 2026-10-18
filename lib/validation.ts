/**
 * Answer validation.
 *
 * Matching pipeline:
 * 1. Normalize both sides (lowercase, trim, collapse punctuation/whitespace)
 * 2. Exact normalized match — accepted immediately
 * 3. Fuzzy match via Levenshtein distance — tolerates:
 *    - Trailing/leading "s" (plurals)
 *    - Transposed letters ("charizrad" → "charizard")
 *    - One missing/extra/wrong character for short words
 *    - Up to 2 edits for longer words
 *    - Does NOT accept answers that are totally different words
 */

import type { AcceptedAnswer, MultiAnswerQuestion, Discovery } from "./types";

// ─── Normalize ───────────────────────────────────────────────────

export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[-''',.:!?()[\]/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Levenshtein distance ─────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  // Fast path
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;

  // Use two rows instead of a full matrix
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Returns the allowed edit distance for a given string length.
 *   len ≤ 3  → 0  (exact only — short words are too ambiguous)
 *   len ≤ 5  → 1  (one typo)
 *   len ≤ 7  → 1  (one typo)
 *   len ≥ 8  → 2  (two edits — covers transpositions like "charziard")
 */
function allowedEdits(len: number): number {
  if (len <= 3) return 0;
  if (len <= 7) return 1;
  return 2;
}

/**
 * Returns true if `guess` is close enough to `target` under the fuzzy policy.
 * Also handles the common "trailing s" case explicitly.
 */
function fuzzyMatch(guess: string, target: string): boolean {
  if (guess === target) return true;

  const maxLen = Math.max(guess.length, target.length);
  const tolerance = allowedEdits(maxLen);

  // Zero tolerance for very short strings — no fuzzy
  if (tolerance === 0) return false;

  // Explicit trailing-s: "charizards" → "charizard" or vice-versa
  if (guess.endsWith("s") && guess.slice(0, -1) === target) return true;
  if (target.endsWith("s") && target.slice(0, -1) === guess) return true;

  const dist = levenshtein(guess, target);
  return dist <= tolerance;
}

// ─── Core match ───────────────────────────────────────────────────

/**
 * Returns the AcceptedAnswer that matches `guess`, or null if none matches.
 * Tries exact normalized match first, then fuzzy.
 */
export function matchAnswer(
  guess: string,
  question: MultiAnswerQuestion
): AcceptedAnswer | null {
  if (!guess || !guess.trim()) return null;
  const norm = normalize(guess);

  // Pass 1: exact normalized match
  for (const answer of question.acceptedAnswers) {
    const candidates = [answer.display, ...answer.aliases].map(normalize);
    if (candidates.includes(norm)) return answer;
  }

  // Pass 2: fuzzy match — only if the guess is long enough to avoid noise
  if (norm.length >= 3) {
    for (const answer of question.acceptedAnswers) {
      const candidates = [answer.display, ...answer.aliases].map(normalize);
      for (const candidate of candidates) {
        if (fuzzyMatch(norm, candidate)) return answer;
      }
    }
  }

  return null;
}

/**
 * Returns whether a canonical answer id has already been discovered.
 */
export function isDuplicate(
  canonicalId: string,
  discoveries: Discovery[]
): boolean {
  return discoveries.some((d) => d.canonicalId === canonicalId);
}

/**
 * Returns true if the input is empty or only whitespace.
 */
export function isEmptyGuess(guess: string): boolean {
  return !guess || !guess.trim();
}

// ─── Full local match pipeline ────────────────────────────────────

export type LocalMatchResult =
  | { kind: "accepted"; answer: AcceptedAnswer }
  | { kind: "duplicate"; existingDisplay: string }
  | { kind: "not-found" }
  | { kind: "empty" };

export function localMatch(
  guess: string,
  question: MultiAnswerQuestion,
  discoveries: Discovery[]
): LocalMatchResult {
  if (isEmptyGuess(guess)) return { kind: "empty" };

  const answer = matchAnswer(guess, question);
  if (!answer) return { kind: "not-found" };

  if (isDuplicate(answer.id, discoveries)) {
    return { kind: "duplicate", existingDisplay: answer.display };
  }

  return { kind: "accepted", answer };
}
