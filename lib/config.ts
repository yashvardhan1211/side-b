import type { RarityConfig, RankConfig } from "./types";

// ─── Rarity Tier Configuration ───────────────────────────────────
// Single source of truth for all rarity labels, points, and styling.
// To tune scoring, edit only this file.
export const RARITY_CONFIG: Record<string, RarityConfig> = {
  "the-hit": {
    id: "the-hit",
    label: "The Hit",
    description: "Everyone knows this one. The obvious answer.",
    shortDesc: "Very common",
    points: 100,
    dotColor: "#9A927F",
    bgClass: "rarity-bg-the-hit",
    textClass: "rarity-the-hit",
  },
  "radio-rotation": {
    id: "radio-rotation",
    label: "Radio Rotation",
    description: "Familiar to most people who pay attention.",
    shortDesc: "Common",
    points: 200,
    dotColor: "#7A8B6F",
    bgClass: "rarity-bg-radio-rotation",
    textClass: "rarity-radio-rotation",
  },
  "b-side": {
    id: "b-side",
    label: "B-Side",
    description: "Recognisable to those who dig deeper.",
    shortDesc: "Less obvious",
    points: 350,
    dotColor: "#6B7A8D",
    bgClass: "rarity-bg-b-side",
    textClass: "rarity-b-side",
  },
  "crate-find": {
    id: "crate-find",
    label: "Crate Find",
    description: "Known to enthusiasts and serious followers.",
    shortDesc: "Uncommon",
    points: 500,
    dotColor: "#7D6A8A",
    bgClass: "rarity-bg-crate-find",
    textClass: "rarity-crate-find",
  },
  "cult-favourite": {
    id: "cult-favourite",
    label: "Cult Favourite",
    description: "Rare knowledge. A dedicated community keeps it alive.",
    shortDesc: "Rare",
    points: 700,
    dotColor: "#813B3D",
    bgClass: "rarity-bg-cult-favourite",
    textClass: "rarity-cult-favourite",
  },
  "deep-vault": {
    id: "deep-vault",
    label: "Deep Vault",
    description: "Exceptional obscurity. Almost nobody knows this.",
    shortDesc: "Exceptional",
    points: 1000,
    dotColor: "#242421",
    bgClass: "rarity-bg-deep-vault",
    textClass: "rarity-deep-vault",
  },
};

export const RARITY_ORDER: string[] = [
  "the-hit",
  "radio-rotation",
  "b-side",
  "crate-find",
  "cult-favourite",
  "deep-vault",
];

// ─── Overall Rank Configuration ──────────────────────────────────
// minPercent = minimum percentage of max possible score for the edition.
// Thresholds are calculated against actual max score, not a fixed cap.
export const RANK_CONFIG: RankConfig[] = [
  {
    id: "vault-find",
    label: "Vault Find",
    description: "Extraordinary. You went off the map.",
    minPercent: 85,
  },
  {
    id: "crate-digger",
    label: "Crate Digger",
    description: "Your curiosity is rare. Well done.",
    minPercent: 65,
  },
  {
    id: "sleeve-notes",
    label: "Sleeve Notes",
    description: "You read between the lines.",
    minPercent: 45,
  },
  {
    id: "flip-side",
    label: "Flip Side",
    description: "You're getting there. The B-side awaits.",
    minPercent: 25,
  },
  {
    id: "on-repeat",
    label: "On Repeat",
    description: "Every listening session teaches something new.",
    minPercent: 0,
  },
];

// ─── Game Constants ──────────────────────────────────────────────
export const QUESTIONS_PER_EDITION = 5;
export const INDIA_TIMEZONE = "Asia/Kolkata";

/** Default seconds each round lasts. Stored per-question for flexibility. */
export const DEFAULT_ROUND_SECONDS = 25;

/**
 * Grace period (ms) after the deadline during which a submission that was
 * dispatched before the deadline may still be processed. After this window
 * the submission is rejected as "too-late".
 */
export const SUBMISSION_GRACE_MS = 500;

/**
 * When an AI-validated answer has no matching curated rarity, fall back to
 * this tier rather than refusing to score it or inventing a random tier.
 */
export const AI_FALLBACK_RARITY: import("./types").RarityTier = "b-side";
