import { RARITY_CONFIG, RANK_CONFIG } from "./config";
import type { RarityTier, OverallRank, RoundState, RankConfig, MultiAnswerQuestion } from "./types";

/**
 * Returns the configured points for a rarity tier.
 * Single source of truth — UI must not calculate this independently.
 */
export function getPoints(rarity: RarityTier): number {
  return RARITY_CONFIG[rarity]?.points ?? 0;
}

/**
 * Returns the theoretical maximum score a player can achieve for one question.
 * This is the highest-points answer in the question's bank — not the sum of all answers.
 * (A player can only find each answer once, and scoring should feel achievable.)
 *
 * We use the single highest-value answer as the per-question ceiling.
 */
export function getQuestionMaxScore(question: MultiAnswerQuestion): number {
  if (question.acceptedAnswers.length === 0) return 0;
  return Math.max(...question.acceptedAnswers.map((a) => a.points));
}

/**
 * Returns the theoretical maximum score for an entire edition.
 * = sum of each question's single highest-value answer.
 * For a 5-question edition this is typically 5 × 1000 = 5000 max.
 */
export function getEditionMaxScore(questions: MultiAnswerQuestion[]): number {
  return questions.reduce((sum, q) => sum + getQuestionMaxScore(q), 0);
}

/**
 * Sums the score across all completed rounds.
 */
export function getTotalScore(rounds: RoundState[]): number {
  return rounds.reduce((sum, r) => sum + r.roundScore, 0);
}

/**
 * Counts the total number of accepted discoveries across all rounds.
 */
export function getTotalDiscoveries(rounds: RoundState[]): number {
  return rounds.reduce((sum, r) => sum + r.discoveries.length, 0);
}

/**
 * Determines the overall rank based on score vs max possible score.
 * RANK_CONFIG is sorted highest-first; we walk it until the threshold is met.
 */
export function getRank(score: number, maxScore: number): OverallRank {
  if (maxScore === 0) return "on-repeat";
  const pct = (score / maxScore) * 100;
  for (const rank of RANK_CONFIG) {
    if (pct >= rank.minPercent) return rank.id;
  }
  return "on-repeat";
}

/**
 * Returns the full RankConfig for a given rank id.
 */
export function getRankConfig(rankId: OverallRank): RankConfig {
  return RANK_CONFIG.find((r) => r.id === rankId) ?? RANK_CONFIG[RANK_CONFIG.length - 1];
}
