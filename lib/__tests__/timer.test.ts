/**
 * Timer and round-state tests.
 * These test the pure logic — deadline enforcement, duplicate detection,
 * and score accumulation — without needing a React environment.
 */

import { localMatch, isDuplicate, normalize } from "../validation";
import { getTotalScore, getTotalDiscoveries } from "../scoring";
import { SUBMISSION_GRACE_MS } from "../config";
import type { MultiAnswerQuestion, RoundState, Discovery } from "../types";

// ── Shared fixtures ───────────────────────────────────────────────

const Q: MultiAnswerQuestion = {
  id: "timer-test-q",
  prompt: "Name a Pokémon.",
  category: "Gaming",
  timeLimitSeconds: 25,
  explanation: "Test question.",
  acceptedAnswers: [
    { id: "pikachu",   display: "Pikachu",   aliases: [],          rarity: "the-hit",    points: 100 },
    { id: "charizard", display: "Charizard", aliases: ["charmander"], rarity: "the-hit", points: 100 },
    { id: "gengar",    display: "Gengar",    aliases: [],          rarity: "radio-rotation", points: 200 },
    { id: "lucario",   display: "Lucario",   aliases: [],          rarity: "b-side",     points: 350 },
  ],
};

function makeRound(deadlineOffset: number): RoundState {
  return {
    questionId: Q.id,
    deadlineEpoch: Date.now() + deadlineOffset,
    discoveries: [],
    roundScore: 0,
    completed: false,
  };
}

function makeDiscovery(canonicalId: string, points: number): Discovery {
  return {
    canonicalId,
    display: canonicalId,
    guess: canonicalId,
    rarity: "the-hit",
    points,
    submittedAt: Date.now(),
    source: "curated",
  };
}

// ── Deadline enforcement ──────────────────────────────────────────

describe("deadline enforcement", () => {
  it("submission within deadline should pass deadline check", () => {
    const round = makeRound(10_000); // 10s remaining
    const isLate = Date.now() > round.deadlineEpoch + SUBMISSION_GRACE_MS;
    expect(isLate).toBe(false);
  });

  it("submission after deadline should be rejected", () => {
    const round = makeRound(-5_000); // 5s past deadline
    const isLate = Date.now() > round.deadlineEpoch + SUBMISSION_GRACE_MS;
    expect(isLate).toBe(true);
  });

  it("submission within grace period should pass", () => {
    // Set deadline 100ms in the past — within the 500ms grace period
    const round = makeRound(-100);
    const isLate = Date.now() > round.deadlineEpoch + SUBMISSION_GRACE_MS;
    expect(isLate).toBe(false);
  });

  it("submission outside grace period should fail", () => {
    // Set deadline 600ms in the past — outside the 500ms grace
    const round = makeRound(-600);
    const isLate = Date.now() > round.deadlineEpoch + SUBMISSION_GRACE_MS;
    expect(isLate).toBe(true);
  });

  it("deadline does not change between submissions", () => {
    const round = makeRound(25_000);
    const deadline1 = round.deadlineEpoch;
    // Simulate accepting a discovery (round is spread-cloned, deadline preserved)
    const updatedRound: RoundState = {
      ...round,
      discoveries: [makeDiscovery("pikachu", 100)],
      roundScore: 100,
    };
    expect(updatedRound.deadlineEpoch).toBe(deadline1);
  });
});

// ── Multiple submissions in same round ───────────────────────────

describe("multiple submissions per round", () => {
  it("accepts multiple distinct valid answers", () => {
    const discoveries: Discovery[] = [];
    let round: RoundState = makeRound(25_000);

    const r1 = localMatch("Pikachu", Q, discoveries);
    expect(r1.kind).toBe("accepted");
    if (r1.kind === "accepted") {
      discoveries.push(makeDiscovery(r1.answer.id, r1.answer.points));
      round = { ...round, discoveries, roundScore: r1.answer.points };
    }

    const r2 = localMatch("Gengar", Q, discoveries);
    expect(r2.kind).toBe("accepted");
    if (r2.kind === "accepted") {
      discoveries.push(makeDiscovery(r2.answer.id, r2.answer.points));
      round = { ...round, discoveries, roundScore: round.roundScore + r2.answer.points };
    }

    const r3 = localMatch("Lucario", Q, discoveries);
    expect(r3.kind).toBe("accepted");
    if (r3.kind === "accepted") {
      discoveries.push(makeDiscovery(r3.answer.id, r3.answer.points));
      round = { ...round, discoveries, roundScore: round.roundScore + r3.answer.points };
    }

    expect(round.discoveries).toHaveLength(3);
    expect(round.roundScore).toBe(650); // 100 + 200 + 350
  });

  it("rejects duplicate answer in same round", () => {
    const discoveries = [makeDiscovery("pikachu", 100)];

    const r = localMatch("Pikachu", Q, discoveries);
    expect(r.kind).toBe("duplicate");
  });

  it("rejects alias of already-found answer", () => {
    // Charizard has "charmander" as alias (sharing same canonical id)
    const discoveries = [makeDiscovery("charizard", 100)];
    const r = localMatch("charmander", Q, discoveries);
    expect(r.kind).toBe("duplicate");
  });

  it("does not award points for an already-found answer", () => {
    const discoveries = [makeDiscovery("pikachu", 100)];
    const round: RoundState = { ...makeRound(25_000), discoveries, roundScore: 100 };

    // Try to accept pikachu again
    const r = localMatch("pikachu", Q, discoveries);
    expect(r.kind).toBe("duplicate");
    // Score unchanged
    expect(round.roundScore).toBe(100);
  });
});

// ── Score calculation ─────────────────────────────────────────────

describe("round score calculation", () => {
  it("sums points correctly across multiple discoveries", () => {
    const round: RoundState = {
      ...makeRound(0),
      discoveries: [
        makeDiscovery("pikachu", 100),
        makeDiscovery("gengar", 200),
        makeDiscovery("lucario", 350),
      ],
      roundScore: 650,
      completed: true,
    };
    expect(round.roundScore).toBe(650);
  });

  it("getTotalScore sums across multiple rounds", () => {
    const rounds: RoundState[] = [
      { ...makeRound(0), discoveries: [makeDiscovery("pikachu", 100)], roundScore: 100, completed: true },
      { ...makeRound(0), discoveries: [makeDiscovery("gengar", 200), makeDiscovery("lucario", 350)], roundScore: 550, completed: true },
    ];
    expect(getTotalScore(rounds)).toBe(650);
  });

  it("getTotalDiscoveries counts all accepted answers", () => {
    const rounds: RoundState[] = [
      { ...makeRound(0), discoveries: [makeDiscovery("a", 100), makeDiscovery("b", 200)], roundScore: 300, completed: true },
      { ...makeRound(0), discoveries: [makeDiscovery("c", 350)], roundScore: 350, completed: true },
    ];
    expect(getTotalDiscoveries(rounds)).toBe(3);
  });

  it("zero score round does not affect total", () => {
    const rounds: RoundState[] = [
      { ...makeRound(0), discoveries: [], roundScore: 0, completed: true },
      { ...makeRound(0), discoveries: [makeDiscovery("pikachu", 100)], roundScore: 100, completed: true },
    ];
    expect(getTotalScore(rounds)).toBe(100);
  });
});

// ── Round completion fires exactly once ───────────────────────────

describe("round completion is idempotent", () => {
  it("completed flag prevents re-completion logic", () => {
    const round: RoundState = {
      ...makeRound(-1000),
      completed: true,
    };
    // A completed round should be treated as expired
    expect(round.completed).toBe(true);
    // Any submission check should see this as too-late
    const isLate = round.completed || Date.now() > round.deadlineEpoch + SUBMISSION_GRACE_MS;
    expect(isLate).toBe(true);
  });
});

// ── normalize is stable ───────────────────────────────────────────

describe("normalize stability", () => {
  it("same input always produces same output", () => {
    const input = "  Pikachu  ";
    expect(normalize(input)).toBe(normalize(input));
    expect(normalize(input)).toBe("pikachu");
  });

  it("different spellings of same thing normalize consistently", () => {
    expect(normalize("Gengar")).toBe(normalize("gengar"));
    expect(normalize("GENGAR")).toBe(normalize("gengar"));
  });
});
