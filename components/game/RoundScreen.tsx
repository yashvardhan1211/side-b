"use client";

/**
 * RoundScreen — the active 25-second round UI.
 *
 * TIMER DESIGN — why it works this way:
 *
 * The deadline is a fixed epoch stored in RoundState (persisted to
 * localStorage). The countdown is calculated from Date.now() every 100ms —
 * it is NEVER decremented from a counter, so it cannot drift.
 *
 * KEY FIX: onExpired is stored in a ref. The countdown useEffect depends ONLY
 * on round.deadlineEpoch (which never changes mid-round) — not on the
 * onExpired prop or any other changing value. This means:
 *   - Accepting an answer does NOT re-run the timer effect.
 *   - Re-renders do NOT reset the countdown.
 *   - The timer fires exactly once per round.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Clock, ChevronDown, ChevronUp, Zap } from "lucide-react";
import type { MultiAnswerQuestion, RoundState, ValidationOutcome, Discovery } from "@/lib/types";
import { RARITY_CONFIG } from "@/lib/config";
import RarityBadge from "@/components/ui/RarityBadge";

interface RoundScreenProps {
  question: MultiAnswerQuestion;
  round: RoundState;
  roundIndex: number;
  totalRounds: number;
  editionNumber: number;
  lastOutcome: ValidationOutcome | null;
  isPending: boolean;
  onSubmit: (guess: string) => void;
  onExpired: () => void;
}

export default function RoundScreen({
  question,
  round,
  roundIndex,
  totalRounds,
  editionNumber,
  lastOutcome,
  isPending,
  onSubmit,
  onExpired,
}: RoundScreenProps) {
  const [guess, setGuess] = useState("");
  const [msRemaining, setMsRemaining] = useState(
    Math.max(0, round.deadlineEpoch - Date.now())
  );
  const [hintVisible, setHintVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Store onExpired in a ref so the timer effect never needs to re-run
  // when the parent re-renders (e.g. after a discovery is accepted).
  const onExpiredRef = useRef(onExpired);
  useEffect(() => { onExpiredRef.current = onExpired; }, [onExpired]);

  // Track whether we've already fired expiry this round
  const firedRef = useRef(false);
  // Reset the fired flag when the question changes (new round)
  useEffect(() => { firedRef.current = false; }, [question.id]);

  // ── Countdown — depends ONLY on deadlineEpoch ─────────────────
  // This effect NEVER re-runs due to answer submissions or re-renders.
  useEffect(() => {
    // If deadline is already past when we mount (resumed from storage), fire immediately.
    if (Date.now() >= round.deadlineEpoch) {
      if (!firedRef.current) {
        firedRef.current = true;
        setMsRemaining(0);
        onExpiredRef.current();
      }
      return;
    }

    const id = setInterval(() => {
      const remaining = round.deadlineEpoch - Date.now();
      if (remaining <= 0) {
        clearInterval(id);
        setMsRemaining(0);
        if (!firedRef.current) {
          firedRef.current = true;
          onExpiredRef.current();
        }
      } else {
        setMsRemaining(remaining);
      }
    }, 100);

    return () => clearInterval(id);
  }, [round.deadlineEpoch]); // ← ONLY deadlineEpoch, nothing else

  // ── Auto-focus input when round starts ───────────────────────
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [question.id]);

  // ── Clear input immediately when answer is accepted ──────────
  useEffect(() => {
    if (lastOutcome?.status === "accepted") {
      setGuess("");
      // Re-focus after a brief moment so the next keystroke lands in the input
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [lastOutcome]);

  const handleSubmit = useCallback(() => {
    const trimmed = guess.trim();
    if (!trimmed || isPending || msRemaining <= 0) return;
    onSubmit(trimmed);
    // Don't clear here — wait for accepted outcome to clear cleanly
  }, [guess, isPending, msRemaining, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Derived display values ────────────────────────────────────
  const totalMs = question.timeLimitSeconds * 1000;
  const secondsLeft = Math.ceil(msRemaining / 1000);
  const pct = Math.max(0, Math.min(100, (msRemaining / totalMs) * 100));
  const isUrgent = secondsLeft <= 8 && secondsLeft > 4;
  const isCritical = secondsLeft <= 4;
  const isExpired = msRemaining <= 0;

  return (
    <div className="max-w-content mx-auto px-5 md:px-0 py-6 animate-slide-up">

      {/* ── Round tracker ───────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "var(--color-dust-border)" }}
          role="progressbar"
          aria-valuenow={roundIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalRounds}
          aria-label={`Round ${roundIndex + 1} of ${totalRounds}`}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((roundIndex + 1) / totalRounds) * 100}%`,
              backgroundColor: "var(--color-ink)",
            }}
          />
        </div>
        <span className="font-mono text-sm flex-shrink-0" style={{ color: "var(--color-ink)" }}>
          {String(roundIndex + 1).padStart(2, "0")}
          <span style={{ color: "var(--color-dust)" }}>
            {" "}/ {String(totalRounds).padStart(2, "0")}
          </span>
        </span>
      </div>

      {/* ── Timer bar + digit ───────────────────────────────── */}
      <div
        className="relative mb-6 px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: isCritical
            ? "var(--color-oxblood)"
            : isUrgent
            ? "var(--color-ink)"
            : "rgba(36,36,33,0.06)",
          transition: "background-color 0.4s",
        }}
      >
        <div className="flex items-center gap-2">
          <Clock
            size={13}
            style={{ color: isCritical || isUrgent ? "var(--color-paper)" : "var(--color-dust)" }}
          />
          <span
            className="label-caps"
            style={{ color: isCritical || isUrgent ? "var(--color-paper)" : "var(--color-dust)" }}
          >
            {isExpired ? "Time's up" : "Time remaining"}
          </span>
        </div>
        <span
          className="font-mono text-3xl font-black tabular-nums"
          style={{ color: isCritical || isUrgent ? "var(--color-paper)" : "var(--color-ink)" }}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${secondsLeft} seconds remaining`}
        >
          {isExpired ? "00" : String(secondsLeft).padStart(2, "0")}
        </span>

        {/* Depleting bar at bottom of timer block */}
        <div
          className="absolute bottom-0 left-0 h-0.5"
          aria-hidden="true"
          style={{
            width: `${pct}%`,
            backgroundColor: isCritical
              ? "rgba(242,235,221,0.5)"
              : isUrgent
              ? "rgba(242,235,221,0.4)"
              : "var(--color-dust)",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* ── Category + prompt ───────────────────────────────── */}
      <p className="label-caps mb-2" style={{ color: "var(--color-oxblood)" }}>
        {question.category}
      </p>

      {question.intro && (
        <p className="font-serif italic text-sm mb-3" style={{ color: "var(--color-dust)" }}>
          {question.intro}
        </p>
      )}

      <h2
        className="font-serif text-2xl md:text-3xl font-bold leading-snug mb-5"
        style={{ color: "var(--color-ink)" }}
      >
        {question.prompt}
      </h2>

      {/* ── Input + submit (hidden when expired) ────────────── */}
      {!isExpired && (
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              placeholder="Name one…"
              autoComplete="off"
              spellCheck={false}
              aria-label="Your answer"
              className="flex-1 px-4 py-3 font-sans text-base border focus:outline-none focus-visible:ring-2 focus-visible:ring-oxblood"
              style={{
                backgroundColor: "rgba(242,235,221,0.8)",
                borderColor: "var(--color-dust-border)",
                color: "var(--color-ink)",
                borderRadius: "2px",
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isPending || !guess.trim()}
              className="px-5 py-3 font-mono text-xs tracking-widest uppercase transition-opacity disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-paper)",
                borderRadius: "2px",
                minWidth: "5.5rem",
                letterSpacing: "0.1em",
              }}
              aria-label="Submit answer"
            >
              {isPending ? "…" : "Submit"}
            </button>
          </div>

          {/* Inline feedback — appears below input, never interrupts */}
          {lastOutcome && lastOutcome.status !== "empty" && (
            <FeedbackLine outcome={lastOutcome} />
          )}
        </div>
      )}

      {/* ── Hint ────────────────────────────────────────────── */}
      {question.hint && !isExpired && (
        <div className="border mb-4" style={{ borderColor: "var(--color-dust-border)" }}>
          <button
            onClick={() => setHintVisible((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
            aria-expanded={hintVisible}
          >
            <span className="label-caps-ink">Need a nudge?</span>
            {hintVisible
              ? <ChevronUp size={13} style={{ color: "var(--color-dust)" }} />
              : <ChevronDown size={13} style={{ color: "var(--color-dust)" }} />
            }
          </button>
          {hintVisible && (
            <p
              className="px-4 pb-3 pt-2 border-t text-sm font-serif italic"
              style={{ borderColor: "var(--color-dust-border)", color: "var(--color-dust)" }}
            >
              {question.hint}
            </p>
          )}
        </div>
      )}

      {/* ── Running discoveries list ─────────────────────────── */}
      {round.discoveries.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="label-caps">Found — {round.discoveries.length}</p>
            {round.roundScore > 0 && (
              <span className="font-mono text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                +{round.roundScore} pts
              </span>
            )}
          </div>
          <div className="space-y-1">
            {round.discoveries.map((d) => (
              <DiscoveryPill key={d.canonicalId} discovery={d} />
            ))}
          </div>
        </div>
      )}

      {/* ── Expired state ────────────────────────────────────── */}
      {isExpired && (
        <div
          className="p-4 text-center animate-fade-in"
          style={{ backgroundColor: "var(--color-ink)", color: "var(--color-paper)" }}
        >
          <p className="font-serif font-bold text-lg mb-1">Time's up.</p>
          <p className="label-caps" style={{ color: "var(--color-dust)" }}>
            {round.discoveries.length > 0
              ? `${round.discoveries.length} answer${round.discoveries.length > 1 ? "s" : ""} found — see results below.`
              : "No answers found this round."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Feedback line ─────────────────────────────────────────────────

function FeedbackLine({ outcome }: { outcome: ValidationOutcome }) {
  const styles: Record<string, { color: string; bg: string }> = {
    accepted:  { color: "var(--color-ink)",     bg: "rgba(36,36,33,0.06)" },
    duplicate: { color: "var(--color-dust)",    bg: "transparent" },
    invalid:   { color: "var(--color-oxblood)", bg: "rgba(129,59,61,0.06)" },
    pending:   { color: "var(--color-dust)",    bg: "transparent" },
    "too-late":{ color: "var(--color-oxblood)", bg: "transparent" },
  };
  const s = styles[outcome.status] ?? styles.invalid;

  return (
    <div
      className="mt-2 px-3 py-2 text-xs font-mono animate-fade-in"
      style={{ backgroundColor: s.bg, color: s.color, borderRadius: "2px" }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {outcome.status === "accepted" && outcome.discovery ? (
        <span className="flex items-center gap-2 flex-wrap">
          <Check size={11} strokeWidth={3} />
          <span className="font-medium">{outcome.discovery.display}</span>
          <RarityBadge tier={outcome.discovery.rarity} size="sm" />
          <span className="font-bold ml-auto">+{outcome.discovery.points}</span>
        </span>
      ) : (
        outcome.message
      )}
    </div>
  );
}

// ── Discovery pill ────────────────────────────────────────────────

function DiscoveryPill({ discovery }: { discovery: Discovery }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 animate-fade-in"
      style={{
        backgroundColor: "rgba(36,36,33,0.04)",
        borderLeft: `2px solid ${RARITY_CONFIG[discovery.rarity]?.dotColor ?? "#9A927F"}`,
      }}
    >
      <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-ink)" }}>
        {discovery.display}
      </span>
      <RarityBadge tier={discovery.rarity} size="sm" />
      <span className="font-mono text-xs font-bold" style={{ color: "var(--color-ink)" }}>
        +{discovery.points}
      </span>
      {discovery.source === "ai" && (
        <span className="label-caps" style={{ color: "var(--color-dust)", fontSize: "0.48rem" }}>
          AI
        </span>
      )}
    </div>
  );
}

// Re-export type for test usage
export type { RoundScreenProps };
