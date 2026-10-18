"use client";

/**
 * GameEngine — orchestrates the full daily edition state machine.
 *
 * State model:
 *   intro → round-active (25s timer) → round-ended → [next round] → results
 *
 * The deadline is stored in GameState.rounds[i].deadlineEpoch so a refresh
 * does not grant a fresh 25 seconds — the remaining time is recalculated from
 * the stored deadline.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  DailyEdition,
  GameState,
  GamePhase,
  RoundState,
  Discovery,
  ValidationOutcome,
  ValidationStatus,
} from "@/lib/types";
import { localMatch } from "@/lib/validation";
import { getPoints, getTotalScore, getTotalDiscoveries, getRank, getEditionMaxScore } from "@/lib/scoring";
import {
  loadGameState,
  saveGameState,
  saveCompletedEdition,
  isEditionCompleted,
  updatePlayerStats,
  getAICacheEntry,
  saveAICacheEntry,
} from "@/lib/storage";import { SUBMISSION_GRACE_MS, DEFAULT_ROUND_SECONDS } from "@/lib/config";
import { getTodayEditionId } from "@/lib/date";
import { normalize } from "@/lib/validation";

import GameIntro from "./GameIntro";
import RoundScreen from "./RoundScreen";
import RoundReveal from "./RoundReveal";
import ResultsScreen from "./ResultsScreen";

interface GameEngineProps {
  edition: DailyEdition;
  editionNumber: number;
}

function buildInitialState(edition: DailyEdition): GameState {
  return {
    editionId: edition.id,
    phase: "intro",
    currentRoundIndex: 0,
    rounds: [],
    startedAt: new Date().toISOString(),
  };
}

function buildRoundState(questionId: string, timeLimitSeconds: number): RoundState {
  return {
    questionId,
    deadlineEpoch: Date.now() + timeLimitSeconds * 1000,
    discoveries: [],
    roundScore: 0,
    completed: false,
  };
}

export default function GameEngine({ edition, editionNumber }: GameEngineProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pendingGuess, setPendingGuess] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<ValidationOutcome | null>(null);

  // Always-current ref to gameState so callbacks never close over stale state
  const gameStateRef = useRef<GameState | null>(null);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // ── Hydrate from storage on mount ───────────────────────────
  useEffect(() => {
    const stored = loadGameState();

    if (stored && stored.editionId === edition.id) {
      // Resume in-progress game.
      // If we're in round-active but the deadline has passed, advance to round-ended.
      if (stored.phase === "round-active") {
        const round = stored.rounds[stored.currentRoundIndex];
        if (round && Date.now() > round.deadlineEpoch + SUBMISSION_GRACE_MS) {
          const updated: GameState = {
            ...stored,
            phase: "round-ended",
            rounds: stored.rounds.map((r, i) =>
              i === stored.currentRoundIndex ? { ...r, completed: true } : r
            ),
          };
          saveGameState(updated);
          setGameState(updated);
          return;
        }
      }
      setGameState(stored);
      return;
    }

    if (isEditionCompleted(edition.id)) {
      setGameState({
        editionId: edition.id,
        phase: "results",
        currentRoundIndex: edition.questions.length,
        rounds: [],
        startedAt: new Date().toISOString(),
      });
      return;
    }

    const fresh = buildInitialState(edition);
    setGameState(fresh);
    saveGameState(fresh);
  }, [edition]);

  const persist = useCallback((next: GameState) => {
    setGameState(next);
    saveGameState(next);
  }, []);

  // ── Begin game (intro → first round) ────────────────────────
  const beginGame = useCallback(() => {
    if (!gameState) return;
    const question = edition.questions[0];
    if (!question) return;
    const round = buildRoundState(question.id, question.timeLimitSeconds ?? DEFAULT_ROUND_SECONDS);
    const next: GameState = {
      ...gameState,
      phase: "round-active",
      currentRoundIndex: 0,
      rounds: [round],
    };
    persist(next);
    setLastOutcome(null);
  }, [gameState, edition, persist]);

  // ── Handle timer expiry ──────────────────────────────────────
  // Uses gameStateRef so this callback is stable and never closes over stale state.
  const handleRoundExpired = useCallback(() => {
    const current = gameStateRef.current;
    if (!current || current.phase !== "round-active") return;
    const rounds = current.rounds.map((r, i) =>
      i === current.currentRoundIndex ? { ...r, completed: true } : r
    );
    const next: GameState = { ...current, phase: "round-ended", rounds };
    persist(next);
    setPendingGuess(null);
  }, [persist]); // persist is stable (useCallback with no deps that change)

  // ── Submit an answer ─────────────────────────────────────────
  const submitAnswer = useCallback(
    async (guess: string) => {
      // Always read latest state via ref for the async path
      const currentState = gameStateRef.current;
      if (!currentState || currentState.phase !== "round-active") return;

      const question = edition.questions[currentState.currentRoundIndex];
      if (!question) return;

      const round = currentState.rounds[currentState.currentRoundIndex];
      if (!round) return;

      // Deadline check — apply grace period
      const now = Date.now();
      if (now > round.deadlineEpoch + SUBMISSION_GRACE_MS) {
        setLastOutcome({ status: "too-late", message: "Time's up. This answer won't count." });
        return;
      }

      if (!guess.trim()) {
        setLastOutcome({ status: "empty", message: "Type something first." });
        return;
      }

      // ── 1. Local curated bank check ──────────────────────────
      const localResult = localMatch(guess, question, round.discoveries);

      if (localResult.kind === "accepted") {
        const { answer } = localResult;
        const discovery: Discovery = {
          canonicalId: answer.id,
          display: answer.display,
          guess,
          rarity: answer.rarity,
          points: answer.points,
          context: answer.context,
          submittedAt: now,
          source: "curated",
        };
        acceptDiscovery(discovery, currentState, round);
        return;
      }

      if (localResult.kind === "duplicate") {
        setLastOutcome({
          status: "duplicate",
          display: localResult.existingDisplay,
          message: `Already found: ${localResult.existingDisplay}`,
        });
        return;
      }

      if (localResult.kind === "empty") {
        setLastOutcome({ status: "empty", message: "Type something first." });
        return;
      }

      // ── 2. not-found → check AI cache then AI endpoint ───────
      const cacheKey = `${question.id}::${normalize(guess)}`;
      const cached = getAICacheEntry(cacheKey);

      if (cached) {
        if (cached.isValid && cached.rarityTier) {
          if (round.discoveries.some((d) => d.canonicalId === normalize(cached.canonicalAnswer))) {
            setLastOutcome({
              status: "duplicate",
              display: cached.canonicalAnswer,
              message: `Already found: ${cached.canonicalAnswer}`,
            });
            return;
          }
          const discovery: Discovery = {
            canonicalId: normalize(cached.canonicalAnswer),
            display: cached.canonicalAnswer,
            guess,
            rarity: cached.rarityTier as any,
            points: cached.points,
            submittedAt: now,
            source: "ai",
          };
          acceptDiscovery(discovery, currentState, round);
        } else {
          setLastOutcome({ status: "invalid", message: "Not a valid answer for this question." });
        }
        return;
      }

      // ── 3. Call AI validation endpoint ───────────────────────
      setPendingGuess(guess);
      setLastOutcome({ status: "pending", message: "Checking..." });

      try {
        const res = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            prompt: question.prompt,
            inclusionCriteria: question.inclusionCriteria,
            category: question.category,
            guess,
          }),
        });

        // Re-read latest state AFTER the async call — deadline may have passed
        const latestState = gameStateRef.current;
        const latestRound = latestState?.rounds[currentState.currentRoundIndex];

        if (!latestRound || latestRound.completed ||
            Date.now() > latestRound.deadlineEpoch + SUBMISSION_GRACE_MS) {
          setLastOutcome({ status: "too-late", message: "Time ran out. This answer won't count." });
          setPendingGuess(null);
          return;
        }

        if (!res.ok) throw new Error(`Validation endpoint ${res.status}`);

        const data = await res.json();

        saveAICacheEntry(cacheKey, {
          isValid: data.isValid,
          canonicalAnswer: data.canonicalAnswer,
          rarityTier: data.rarityTier,
          points: data.points,
          reason: data.reason,
          cachedAt: Date.now(),
        });

        if (data.isValid && data.rarityTier) {
          if (latestRound.discoveries.some((d) => d.canonicalId === normalize(data.canonicalAnswer))) {
            setLastOutcome({
              status: "duplicate",
              display: data.canonicalAnswer,
              message: `Already found: ${data.canonicalAnswer}`,
            });
            setPendingGuess(null);
            return;
          }

          const discovery: Discovery = {
            canonicalId: normalize(data.canonicalAnswer),
            display: data.canonicalAnswer,
            guess,
            rarity: data.rarityTier,
            points: data.points,
            submittedAt: now,
            source: "ai",
          };
          if (latestState) acceptDiscovery(discovery, latestState, latestRound);
        } else {
          const isDemoMode = res.headers.get("X-SIDEB-Demo-Mode") === "true";
          const hasError = res.headers.get("X-SIDEB-Validation-Error") === "true";
          setLastOutcome({
            status: "invalid",
            message: isDemoMode || hasError
              ? "Not in the answer bank. Try another!"
              : (data.reason ?? "Not a valid answer for this question."),
          });
        }
      } catch (err) {
        console.error("[GameEngine] AI validation error:", err);
        setLastOutcome({
          status: "invalid",
          message: "Couldn't check that answer. Try another.",
        });
      } finally {
        setPendingGuess(null);
      }
    },
    [edition, persist] // no gameState dep — we use gameStateRef instead
  );

  // ── Accept a discovery and update state ──────────────────────
  // Uses the state/round passed in (always current at call time)
  function acceptDiscovery(
    discovery: Discovery,
    state: GameState,
    round: RoundState
  ) {
    const updatedRound: RoundState = {
      ...round,
      discoveries: [...round.discoveries, discovery],
      roundScore: round.roundScore + discovery.points,
    };
    const updatedRounds = state.rounds.map((r, i) =>
      i === state.currentRoundIndex ? updatedRound : r
    );
    const next: GameState = { ...state, rounds: updatedRounds };
    persist(next);
    setLastOutcome({
      status: "accepted",
      discovery,
      message: `${discovery.display} — +${discovery.points} pts`,
    });
  }

  // ── Continue from round-ended to next round or results ───────
  const continueAfterRound = useCallback(() => {
    const current = gameStateRef.current;
    if (!current) return;
    const nextIndex = current.currentRoundIndex + 1;
    const isLast = nextIndex >= edition.questions.length;

    if (isLast) {
      const completedAt = new Date().toISOString();
      const totalScore = getTotalScore(current.rounds);
      const maxScore = getEditionMaxScore(edition.questions);
      const rank = getRank(totalScore, maxScore);

      const completedEdition = {
        editionId: edition.id,
        date: edition.date,
        totalScore,
        totalDiscoveries: getTotalDiscoveries(current.rounds),
        totalQuestions: edition.questions.length,
        rank,
        rounds: current.rounds,
        completedAt,
      };

      saveCompletedEdition(completedEdition);
      updatePlayerStats(completedEdition);

      const finished: GameState = {
        ...current,
        phase: "results",
        currentRoundIndex: nextIndex,
        completedAt,
      };
      persist(finished);
    } else {
      const question = edition.questions[nextIndex];
      const round = buildRoundState(question.id, question.timeLimitSeconds ?? DEFAULT_ROUND_SECONDS);
      const next: GameState = {
        ...current,
        phase: "round-active",
        currentRoundIndex: nextIndex,
        rounds: [...current.rounds, round],
      };
      persist(next);
      setLastOutcome(null);
    }
  }, [edition, persist]);

  // ── Loading ──────────────────────────────────────────────────
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="label-caps animate-pulse">Loading edition...</span>
      </div>
    );
  }

  const currentQuestion = edition.questions[gameState.currentRoundIndex];
  const currentRound = gameState.rounds[gameState.currentRoundIndex] ?? null;
  const todayId = getTodayEditionId();

  // ── Render by phase ──────────────────────────────────────────
  if (gameState.phase === "intro") {
    return (
      <GameIntro
        edition={edition}
        editionNumber={editionNumber}
        onBegin={beginGame}
      />
    );
  }

  if (gameState.phase === "round-active" && currentQuestion && currentRound) {
    return (
      <RoundScreen
        question={currentQuestion}
        round={currentRound}
        roundIndex={gameState.currentRoundIndex}
        totalRounds={edition.questions.length}
        editionNumber={editionNumber}
        lastOutcome={lastOutcome}
        isPending={pendingGuess !== null}
        onSubmit={submitAnswer}
        onExpired={handleRoundExpired}
      />
    );
  }

  if (gameState.phase === "round-ended" && currentQuestion && currentRound) {
    return (
      <RoundReveal
        question={currentQuestion}
        round={currentRound}
        roundIndex={gameState.currentRoundIndex}
        totalRounds={edition.questions.length}
        editionNumber={editionNumber}
        onContinue={continueAfterRound}
        isLastRound={gameState.currentRoundIndex + 1 >= edition.questions.length}
      />
    );
  }

  if (gameState.phase === "results") {
    return (
      <ResultsScreen
        edition={edition}
        editionNumber={editionNumber}
        isToday={edition.id === todayId}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-64">
      <span className="label-caps" style={{ color: "var(--color-oxblood)" }}>
        Something went wrong. Please refresh.
      </span>
    </div>
  );
}
