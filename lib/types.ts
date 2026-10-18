// ─── Rarity Tiers ───────────────────────────────────────────────
export type RarityTier =
  | "the-hit"
  | "radio-rotation"
  | "b-side"
  | "crate-find"
  | "cult-favourite"
  | "deep-vault";

export interface RarityConfig {
  id: RarityTier;
  label: string;
  description: string;
  shortDesc: string;
  points: number;
  dotColor: string;
  bgClass: string;
  textClass: string;
}

// ─── Multi-Answer Question Model ─────────────────────────────────

/**
 * A single valid answer to a multi-answer question.
 * Each answer has its own rarity tier and points — rarity is
 * contextual to the question, not a global property of the entity.
 */
export interface AcceptedAnswer {
  id: string;                   // stable canonical id, e.g. "zindagi-na-milegi-dobara"
  display: string;              // canonical display name shown after reveal
  aliases: string[];            // spelling variants, alternate titles, transliterations
  rarity: RarityTier;
  points: number;               // must match RARITY_CONFIG[rarity].points; stored for immutability
  context?: string;             // short note shown on reveal (optional)
  provisional?: boolean;        // true when rarity is editorially estimated, not data-derived
}

/**
 * A question that accepts many valid answers, each with its own rarity.
 */
export interface MultiAnswerQuestion {
  id: string;
  prompt: string;
  category: string;
  intro?: string;               // flavour text shown before the prompt
  acceptedAnswers: AcceptedAnswer[];
  hint?: string;                // optional nudge, visible on demand
  timeLimitSeconds: number;     // default 25; stored per-question for flexibility
  explanation: string;          // editorial note shown after the round
  inclusionCriteria?: string;   // documents what counts as valid (editorial/testing aid)
  sourceLabel?: string;
  sourceUrl?: string;
}

/**
 * A daily edition is a sequence of multi-answer questions.
 */
export interface DailyEdition {
  id: string;           // "YYYY-MM-DD" in Asia/Kolkata
  date: string;
  title: string;
  description: string;
  questions: MultiAnswerQuestion[];
}

// ─── Game State ─────────────────────────────────────────────────

export type GamePhase =
  | "intro"
  | "round-active"      // timer running, accepting answers
  | "round-ended"       // timer expired, showing round results
  | "results";          // all rounds done, showing edition results

/**
 * A single answer the player submitted and that was accepted in a round.
 * Duplicate and invalid submissions are NOT stored here.
 */
export interface Discovery {
  canonicalId: string;      // matches AcceptedAnswer.id
  display: string;
  guess: string;            // the raw text the player typed
  rarity: RarityTier;
  points: number;
  context?: string;
  submittedAt: number;      // ms since epoch — for deadline enforcement
  source: "curated" | "ai"; // whether validation came from the local bank or the AI
}

/**
 * Outcome of one validation attempt (used internally and returned to UI).
 */
export type ValidationStatus =
  | "accepted"      // valid, not yet found — added to discoveries
  | "duplicate"     // already found this answer in this round
  | "invalid"       // not a valid answer to this question
  | "too-late"      // submitted after deadline
  | "empty"         // blank input
  | "pending";      // AI call in flight

export interface ValidationOutcome {
  status: ValidationStatus;
  discovery?: Discovery;     // populated when status === "accepted"
  display?: string;          // populated for "duplicate" to name the already-found answer
  message: string;           // human-readable feedback line
}

/**
 * State for one round (one question) within the edition.
 */
export interface RoundState {
  questionId: string;
  deadlineEpoch: number;    // ms since epoch when the round expires
  discoveries: Discovery[]; // accepted answers found so far
  roundScore: number;       // sum of discovery points
  completed: boolean;       // true once timer has expired
}

/**
 * Full game state for one daily edition.
 */
export interface GameState {
  editionId: string;
  phase: GamePhase;
  currentRoundIndex: number;
  rounds: RoundState[];     // one entry per started round; length grows as player progresses
  startedAt: string;        // ISO timestamp
  completedAt?: string;
}

// ─── Completed Edition (persisted after game ends) ───────────────

export interface CompletedEdition {
  editionId: string;
  date: string;
  totalScore: number;
  totalDiscoveries: number;
  totalQuestions: number;
  rank: OverallRank;
  rounds: RoundState[];
  completedAt: string;
}

// ─── Player Statistics ──────────────────────────────────────────
export interface PlayerStats {
  editionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  personalBest: number;
  totalScore: number;
  rarityDistribution: Record<RarityTier, number>;
  recentResults: CompletedEdition[];
  lastPlayedDate?: string;
}

// ─── Overall Ranks ───────────────────────────────────────────────
export type OverallRank =
  | "on-repeat"
  | "flip-side"
  | "sleeve-notes"
  | "crate-digger"
  | "vault-find";

export interface RankConfig {
  id: OverallRank;
  label: string;
  description: string;
  minPercent: number;
}

// ─── AI Validation Types ────────────────────────────────────────

/**
 * Request payload sent to the server-side validation endpoint.
 * Never include raw answer bank data that hasn't already been published.
 */
export interface AIValidationRequest {
  questionId: string;
  prompt: string;
  inclusionCriteria?: string;
  category: string;
  guess: string;
}

/**
 * Structured response from the AI validation endpoint.
 * The endpoint is responsible for applying the scoring policy.
 */
export interface AIValidationResponse {
  isValid: boolean;
  canonicalAnswer: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  rarityTier: RarityTier | null;
  points: number;
  needsReview: boolean;
  source: "ai";
}

// ─── Notes ──────────────────────────────────────────────────────
export type NoteCategory =
  | "music"
  | "cinema"
  | "internet"
  | "television"
  | "advertising"
  | "cricket"
  | "literature"
  | "street"
  | "regional";

export interface Note {
  slug: string;
  title: string;
  subtitle: string;
  category: NoteCategory;
  readingTime: number;
  publishedAt: string;
  featured: boolean;
  body: string;
  relatedSlugs?: string[];
}

// ─── Goods ──────────────────────────────────────────────────────
export type ProductStatus = "available" | "preorder" | "sold-out" | "coming-soon";

export interface ProductVariant {
  size: string;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  collection: string;
  description: string;
  details: string[];
  priceInr: number;
  variants: ProductVariant[];
  status: ProductStatus;
  images: string[];
  edition: string;
}
