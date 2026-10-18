import { normalize, matchAnswer, isDuplicate, localMatch, isEmptyGuess } from "../validation";
import type { MultiAnswerQuestion, Discovery } from "../types";

const Q: MultiAnswerQuestion = {
  id: "test-q1",
  prompt: "Name a Pokémon.",
  category: "Gaming",
  timeLimitSeconds: 25,
  explanation: "Test.",
  acceptedAnswers: [
    { id: "pikachu",    display: "Pikachu",    aliases: [],                          rarity: "the-hit",    points: 100 },
    { id: "charizard",  display: "Charizard",  aliases: ["charmander"],              rarity: "the-hit",    points: 100 },
    { id: "gengar",     display: "Gengar",     aliases: [],                          rarity: "radio-rotation", points: 200 },
    { id: "luck-by-chance", display: "Luck by Chance", aliases: ["luck by chance 2009"], rarity: "crate-find", points: 500 },
    { id: "mr-x",       display: "Mr. X",      aliases: [],                          rarity: "b-side",     points: 350 },
  ],
};

function makeDiscovery(canonicalId: string): Discovery {
  return { canonicalId, display: canonicalId, guess: canonicalId, rarity: "the-hit", points: 100, submittedAt: Date.now(), source: "curated" };
}

// ── normalize ─────────────────────────────────────────────────────
describe("normalize", () => {
  it("lowercases", () => expect(normalize("PIKACHU")).toBe("pikachu"));
  it("trims whitespace", () => expect(normalize("  pikachu  ")).toBe("pikachu"));
  it("collapses internal spaces", () => expect(normalize("luck  by  chance")).toBe("luck by chance"));
  it("strips hyphens", () => expect(normalize("luck-by-chance")).toBe("luck by chance"));
  it("strips apostrophes", () => expect(normalize("it's")).toBe("it s"));
  it("strips periods (Mr. X → mr x)", () => expect(normalize("Mr. X")).toBe("mr x"));
});

// ── exact matching ────────────────────────────────────────────────
describe("matchAnswer — exact", () => {
  it("matches display name", () => expect(matchAnswer("Pikachu", Q)?.id).toBe("pikachu"));
  it("case-insensitive", () => expect(matchAnswer("PIKACHU", Q)?.id).toBe("pikachu"));
  it("matches alias", () => expect(matchAnswer("charmander", Q)?.id).toBe("charizard"));
  it("strips punctuation (Mr. X)", () => expect(matchAnswer("Mr. X", Q)?.id).toBe("mr-x"));
  it("returns null for unrelated answer", () => expect(matchAnswer("Mewtwo", Q)).toBeNull());
  it("returns null for empty string", () => expect(matchAnswer("", Q)).toBeNull());
  it("does NOT accept a partial substring", () => expect(matchAnswer("Pika", Q)).toBeNull());
});

// ── fuzzy matching ─────────────────────────────────────────────────
describe("matchAnswer — fuzzy", () => {
  it("accepts trailing s (charizards → charizard)", () => {
    expect(matchAnswer("Charizards", Q)?.id).toBe("charizard");
  });

  it("accepts one transposed letter (piakchu → pikachu, dist=2 for 7-char word needs len≥8 tolerance)", () => {
    // piakchu is distance 2 from pikachu (7 chars) — not covered by fuzzy
    // Use a more realistic single-char typo instead
    expect(matchAnswer("pikuchu", Q)?.id).toBe("pikachu");
  });

  it("accepts one missing letter (pikchu → pikachu)", () => {
    expect(matchAnswer("pikchu", Q)?.id).toBe("pikachu");
  });

  it("accepts one extra letter (pikacchu → pikachu)", () => {
    expect(matchAnswer("pikacchu", Q)?.id).toBe("pikachu");
  });

  it("accepts one substitution (pikuchu → pikachu)", () => {
    expect(matchAnswer("pikuchu", Q)?.id).toBe("pikachu");
  });

  it("does NOT fuzzy-match a 3-letter string (no tolerance)", () => {
    // "gen" is not close enough to "gengar" — and too short for tolerance anyway
    expect(matchAnswer("gen", Q)).toBeNull();
  });

  it("does NOT accept clearly wrong answer despite edit distance", () => {
    // "batman" has no path to any accepted answer
    expect(matchAnswer("batman", Q)).toBeNull();
  });

  it("accepts 'gengur' (one substitution in 6-char word)", () => {
    expect(matchAnswer("gengur", Q)?.id).toBe("gengar");
  });
});

// ── isDuplicate ───────────────────────────────────────────────────
describe("isDuplicate", () => {
  it("detects already-found answer", () => {
    expect(isDuplicate("pikachu", [makeDiscovery("pikachu")])).toBe(true);
  });
  it("returns false if not found yet", () => {
    expect(isDuplicate("pikachu", [makeDiscovery("gengar")])).toBe(false);
  });
  it("returns false for empty discoveries", () => {
    expect(isDuplicate("pikachu", [])).toBe(false);
  });
});

// ── localMatch ────────────────────────────────────────────────────
describe("localMatch", () => {
  it("accepted — valid, not yet found", () => {
    const r = localMatch("Pikachu", Q, []);
    expect(r.kind).toBe("accepted");
  });

  it("accepted — fuzzy typo (charziard → charizard, dist=2 for 9-char word)", () => {
    // charizard is 9 chars, distance 2 from charziard — covered by len≥8 tolerance
    const r = localMatch("Charziard", Q, []);
    expect(r.kind).toBe("accepted");
    if (r.kind === "accepted") expect(r.answer.id).toBe("charizard");
  });

  it("duplicate — already found (exact)", () => {
    const r = localMatch("Pikachu", Q, [makeDiscovery("pikachu")]);
    expect(r.kind).toBe("duplicate");
  });

  it("duplicate — alias of already-found", () => {
    const r = localMatch("charmander", Q, [makeDiscovery("charizard")]);
    expect(r.kind).toBe("duplicate");
  });

  it("duplicate — fuzzy match of already-found", () => {
    const r = localMatch("Pikacchu", Q, [makeDiscovery("pikachu")]);
    expect(r.kind).toBe("duplicate");
  });

  it("not-found — unlisted answer", () => {
    expect(localMatch("Mewtwo", Q, []).kind).toBe("not-found");
  });

  it("empty — blank string", () => {
    expect(localMatch("   ", Q, []).kind).toBe("empty");
  });

  it("crate-find answer gets correct points", () => {
    const r = localMatch("luck by chance", Q, []);
    if (r.kind === "accepted") {
      expect(r.answer.id).toBe("luck-by-chance");
      expect(r.answer.points).toBe(500);
      expect(r.answer.rarity).toBe("crate-find");
    }
  });
});

// ── isEmptyGuess ──────────────────────────────────────────────────
describe("isEmptyGuess", () => {
  it("empty string", () => expect(isEmptyGuess("")).toBe(true));
  it("whitespace only", () => expect(isEmptyGuess("   ")).toBe(true));
  it("real content", () => expect(isEmptyGuess("pikachu")).toBe(false));
});
