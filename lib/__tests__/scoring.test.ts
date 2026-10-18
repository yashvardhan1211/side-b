import { getPoints, getTotalScore, getTotalDiscoveries, getRank, getEditionMaxScore } from "../scoring";
import type { RoundState, Discovery, MultiAnswerQuestion } from "../types";

function makeDiscovery(rarity: string, points: number): Discovery {
  return {
    canonicalId: `test-${rarity}`,
    display: `Test ${rarity}`,
    guess: `test`,
    rarity: rarity as any,
    points,
    submittedAt: Date.now(),
    source: "curated",
  };
}

function makeRound(discoveries: Discovery[]): RoundState {
  return {
    questionId: "q1",
    deadlineEpoch: Date.now() + 25000,
    discoveries,
    roundScore: discoveries.reduce((s, d) => s + d.points, 0),
    completed: false,
  };
}

describe("getPoints", () => {
  it("returns correct points for each tier", () => {
    expect(getPoints("the-hit")).toBe(100);
    expect(getPoints("radio-rotation")).toBe(200);
    expect(getPoints("b-side")).toBe(350);
    expect(getPoints("crate-find")).toBe(500);
    expect(getPoints("cult-favourite")).toBe(700);
    expect(getPoints("deep-vault")).toBe(1000);
  });
  it("returns 0 for unknown tier", () => {
    expect(getPoints("unknown-tier" as any)).toBe(0);
  });
});

describe("getTotalScore", () => {
  it("sums roundScore across all rounds", () => {
    const rounds: RoundState[] = [
      makeRound([makeDiscovery("the-hit", 100), makeDiscovery("b-side", 350)]),
      makeRound([makeDiscovery("crate-find", 500)]),
    ];
    expect(getTotalScore(rounds)).toBe(950);
  });
  it("returns 0 for empty rounds", () => {
    expect(getTotalScore([])).toBe(0);
  });
  it("returns 0 for rounds with no discoveries", () => {
    expect(getTotalScore([makeRound([])])).toBe(0);
  });
});

describe("getTotalDiscoveries", () => {
  it("counts discoveries across all rounds", () => {
    const rounds = [
      makeRound([makeDiscovery("the-hit", 100), makeDiscovery("b-side", 350)]),
      makeRound([makeDiscovery("crate-find", 500)]),
    ];
    expect(getTotalDiscoveries(rounds)).toBe(3);
  });
  it("returns 0 for empty input", () => {
    expect(getTotalDiscoveries([])).toBe(0);
  });
});

describe("getRank", () => {
  it("assigns vault-find for >= 85%", () => {
    expect(getRank(850, 1000)).toBe("vault-find");
    expect(getRank(1000, 1000)).toBe("vault-find");
  });
  it("assigns crate-digger for 65–84%", () => {
    expect(getRank(650, 1000)).toBe("crate-digger");
    expect(getRank(849, 1000)).toBe("crate-digger");
  });
  it("assigns sleeve-notes for 45–64%", () => {
    expect(getRank(450, 1000)).toBe("sleeve-notes");
  });
  it("assigns flip-side for 25–44%", () => {
    expect(getRank(250, 1000)).toBe("flip-side");
  });
  it("assigns on-repeat for < 25%", () => {
    expect(getRank(0, 1000)).toBe("on-repeat");
    expect(getRank(249, 1000)).toBe("on-repeat");
  });
  it("handles zero max score gracefully", () => {
    expect(getRank(0, 0)).toBe("on-repeat");
  });
});

describe("getEditionMaxScore — max is highest answer per question, not sum of all", () => {
  const q: MultiAnswerQuestion = {
    id: "q-test",
    prompt: "Test",
    category: "Test",
    timeLimitSeconds: 25,
    explanation: "Test",
    acceptedAnswers: [
      { id: "a1", display: "A1", aliases: [], rarity: "the-hit",        points: 100 },
      { id: "a2", display: "A2", aliases: [], rarity: "crate-find",     points: 500 },
      { id: "a3", display: "A3", aliases: [], rarity: "deep-vault",     points: 1000 },
    ],
  };

  it("single question max = highest answer's points (1000, not 1600)", () => {
    // Wrong would be 100 + 500 + 1000 = 1600
    // Correct is max(100, 500, 1000) = 1000
    const { getQuestionMaxScore } = require("../scoring");
    expect(getQuestionMaxScore(q)).toBe(1000);
  });

  it("5-question edition with deep-vault in each = max 5000", () => {
    const editions = Array(5).fill(q);
    expect(getEditionMaxScore(editions)).toBe(5000);
  });

  it("edition with only the-hit answers = max 100 per question", () => {
    const simpleQ: MultiAnswerQuestion = {
      ...q,
      acceptedAnswers: [
        { id: "x", display: "X", aliases: [], rarity: "the-hit", points: 100 },
      ],
    };
    expect(getEditionMaxScore([simpleQ, simpleQ])).toBe(200);
  });
});
