/**
 * Local persistence layer.
 * All browser storage is isolated here so a backend can replace it later.
 * Fails gracefully if localStorage is unavailable.
 */

import type { GameState, PlayerStats, CompletedEdition, RarityTier } from "./types";
import { areConsecutiveDays } from "./date";

const KEYS = {
  GAME_STATE:         "sideb:game-state-v2",    // v2 = multi-answer format
  PLAYER_STATS:       "sideb:player-stats",
  COMPLETED_EDITIONS: "sideb:completed-v2",
  ONBOARDING_DONE:    "sideb:onboarding",
  AI_CACHE:           "sideb:ai-cache",          // cached AI evaluations
} as const;

// ─── Safe localStorage helpers ──────────────────────────────────

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ─── Game State ──────────────────────────────────────────────────

export function loadGameState(): GameState | null {
  return safeGet<GameState>(KEYS.GAME_STATE);
}

export function saveGameState(state: GameState): void {
  safeSet(KEYS.GAME_STATE, state);
}

export function clearGameState(): void {
  safeRemove(KEYS.GAME_STATE);
}

// ─── Completed Editions ──────────────────────────────────────────

export function loadCompletedEditions(): CompletedEdition[] {
  return safeGet<CompletedEdition[]>(KEYS.COMPLETED_EDITIONS) ?? [];
}

export function saveCompletedEdition(edition: CompletedEdition): void {
  const existing = loadCompletedEditions();
  const filtered = existing.filter((e) => e.editionId !== edition.editionId);
  safeSet(KEYS.COMPLETED_EDITIONS, [edition, ...filtered]);
}

export function isEditionCompleted(editionId: string): boolean {
  return loadCompletedEditions().some((e) => e.editionId === editionId);
}

export function getCompletedEdition(editionId: string): CompletedEdition | null {
  return loadCompletedEditions().find((e) => e.editionId === editionId) ?? null;
}

// ─── Player Stats ────────────────────────────────────────────────

export function loadPlayerStats(): PlayerStats {
  return (
    safeGet<PlayerStats>(KEYS.PLAYER_STATS) ?? {
      editionsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      personalBest: 0,
      totalScore: 0,
      rarityDistribution: {
        "the-hit": 0,
        "radio-rotation": 0,
        "b-side": 0,
        "crate-find": 0,
        "cult-favourite": 0,
        "deep-vault": 0,
      },
      recentResults: [],
    }
  );
}

export function savePlayerStats(stats: PlayerStats): void {
  safeSet(KEYS.PLAYER_STATS, stats);
}

/**
 * Called once after a player completes an edition.
 * Updates streak, personal best, rarity distribution, and recent results.
 */
export function updatePlayerStats(completed: CompletedEdition): void {
  const stats = loadPlayerStats();
  const lastDate = stats.lastPlayedDate;
  const thisDate = completed.date;

  let newStreak = 1;
  if (lastDate && areConsecutiveDays(lastDate, thisDate)) {
    newStreak = stats.currentStreak + 1;
  } else if (lastDate === thisDate) {
    newStreak = stats.currentStreak;
  }

  const newDist = { ...stats.rarityDistribution };
  for (const round of completed.rounds) {
    for (const d of round.discoveries) {
      const key = d.rarity as RarityTier;
      newDist[key] = (newDist[key] ?? 0) + 1;
    }
  }

  const updated: PlayerStats = {
    editionsCompleted: stats.editionsCompleted + 1,
    currentStreak: newStreak,
    longestStreak: Math.max(stats.longestStreak, newStreak),
    personalBest: Math.max(stats.personalBest, completed.totalScore),
    totalScore: stats.totalScore + completed.totalScore,
    rarityDistribution: newDist,
    recentResults: [completed, ...stats.recentResults].slice(0, 20),
    lastPlayedDate: thisDate,
  };

  savePlayerStats(updated);
}

// ─── AI Evaluation Cache ────────────────────────────────────────
// Keyed by `${questionId}::${normalizedGuess}` so the same answer
// never hits the AI twice within the same browser session.

type AICacheEntry = {
  isValid: boolean;
  canonicalAnswer: string;
  rarityTier: string | null;
  points: number;
  reason: string;
  cachedAt: number;
};

type AICache = Record<string, AICacheEntry>;

export function loadAICache(): AICache {
  return safeGet<AICache>(KEYS.AI_CACHE) ?? {};
}

export function saveAICacheEntry(key: string, entry: AICacheEntry): void {
  const cache = loadAICache();
  cache[key] = entry;
  safeSet(KEYS.AI_CACHE, cache);
}

export function getAICacheEntry(key: string): AICacheEntry | null {
  return loadAICache()[key] ?? null;
}

// ─── Onboarding ──────────────────────────────────────────────────

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.ONBOARDING_DONE) === "true";
}

export function markOnboardingComplete(): void {
  safeSet(KEYS.ONBOARDING_DONE, true);
}

// ─── Full reset ──────────────────────────────────────────────────

export function resetAllData(): void {
  Object.values(KEYS).forEach(safeRemove);
}
