"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import type { MultiAnswerQuestion, RoundState, AcceptedAnswer } from "@/lib/types";
import { RARITY_CONFIG } from "@/lib/config";
import RarityBadge from "@/components/ui/RarityBadge";
import Button from "@/components/ui/Button";

interface RoundRevealProps {
  question: MultiAnswerQuestion;
  round: RoundState;
  roundIndex: number;
  totalRounds: number;
  editionNumber: number;
  onContinue: () => void;
  isLastRound: boolean;
}

export default function RoundReveal({
  question,
  round,
  roundIndex,
  totalRounds,
  editionNumber,
  onContinue,
  isLastRound,
}: RoundRevealProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 150);
    return () => clearTimeout(t);
  }, []);

  const progress = roundIndex + 1;
  const foundIds = new Set(round.discoveries.map((d) => d.canonicalId));
  const foundAnswers = question.acceptedAnswers
    .filter((a) => foundIds.has(a.id))
    .sort((a, b) => b.points - a.points);

  const missedAnswers = question.acceptedAnswers
    .filter((a) => !foundIds.has(a.id))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-content mx-auto px-5 md:px-0 py-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="label-caps">Round {progress} / {totalRounds}</span>
        <span className="label-caps" style={{ color: "var(--color-oxblood)" }}>
          Edition {String(editionNumber).padStart(3, "0")}
        </span>
      </div>

      <div className="rule-heavy mb-6" />

      {/* Round summary headline */}
      <p className="label-caps mb-1" style={{ color: "var(--color-oxblood)" }}>
        {question.category}
      </p>
      <h2
        className="font-serif text-xl md:text-2xl font-bold leading-snug mb-2"
        style={{ color: "var(--color-ink)" }}
      >
        {question.prompt}
      </h2>

      {/* Score */}
      <div
        className="flex items-center justify-between px-4 py-4 mb-6"
        style={{ backgroundColor: "var(--color-ink)" }}
      >
        <div>
          <p className="label-caps mb-1" style={{ color: "var(--color-dust)" }}>
            Round score
          </p>
          <p
            className="font-serif text-3xl font-black"
            style={{ color: "var(--color-paper)" }}
          >
            {round.roundScore}
          </p>
        </div>
        <div className="text-right">
          <p className="label-caps mb-1" style={{ color: "var(--color-dust)" }}>
            Answers found
          </p>
          <p
            className="font-serif text-3xl font-black"
            style={{ color: "var(--color-paper)" }}
          >
            {round.discoveries.length}
            <span
              className="font-normal text-xl ml-1"
              style={{ color: "var(--color-dust)" }}
            >
              / {question.acceptedAnswers.length}
            </span>
          </p>
        </div>
      </div>

      {/* Answers you found */}
      {foundAnswers.length > 0 && revealed && (
        <div className="mb-6 animate-fade-in">
          <p className="label-caps mb-2">You found</p>
          <div className="space-y-px" style={{ backgroundColor: "var(--color-dust-border)" }}>
            {foundAnswers.map((answer) => {
              const discovery = round.discoveries.find(
                (d) => d.canonicalId === answer.id
              );
              return (
                <AnswerRow
                  key={answer.id}
                  answer={answer}
                  found
                  guess={discovery?.guess}
                  source={discovery?.source}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Answers you missed */}
      {missedAnswers.length > 0 && revealed && (
        <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <p className="label-caps mb-2">You missed</p>
          <div className="space-y-px" style={{ backgroundColor: "var(--color-dust-border)" }}>
            {missedAnswers.map((answer) => (
              <AnswerRow key={answer.id} answer={answer} found={false} />
            ))}
          </div>
        </div>
      )}

      {/* Editorial context */}
      {revealed && (
        <div
          className="border-l-2 pl-4 mb-8 animate-fade-in"
          style={{
            borderColor: "var(--color-dust-border)",
            animationDelay: "0.2s",
          }}
        >
          <p className="label-caps mb-2">Context</p>
          <p
            className="text-sm leading-relaxed font-serif"
            style={{ color: "var(--color-ink)" }}
          >
            {question.explanation}
          </p>
          {question.sourceLabel && (
            <p
              className="label-caps mt-2"
              style={{ color: "var(--color-dust)" }}
            >
              {question.sourceLabel}
            </p>
          )}
        </div>
      )}

      {/* Continue */}
      <Button fullWidth size="lg" onClick={onContinue} className="group">
        {isLastRound ? "See your final results" : "Next round"}
        <ArrowRight
          size={14}
          className="ml-3 transition-transform group-hover:translate-x-1"
        />
      </Button>
    </div>
  );
}

// ── Single answer row ─────────────────────────────────────────────

function AnswerRow({
  answer,
  found,
  guess,
  source,
}: {
  answer: AcceptedAnswer;
  found: boolean;
  guess?: string;
  source?: string;
}) {
  const config = RARITY_CONFIG[answer.rarity];

  return (
    <div
      className="px-4 py-3"
      style={{ backgroundColor: "var(--color-paper)" }}
    >
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-4 h-4 flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: found ? "var(--color-ink)" : "transparent",
            border: found ? "none" : `1px solid var(--color-dust-border)`,
          }}
        >
          {found ? (
            <Check size={9} color="var(--color-paper)" strokeWidth={3} />
          ) : (
            <X size={9} color="var(--color-dust)" strokeWidth={2} />
          )}
        </div>

        <span
          className="text-sm font-medium flex-1 truncate"
          style={{
            color: found ? "var(--color-ink)" : "var(--color-dust)",
          }}
        >
          {answer.display}
        </span>

        <RarityBadge tier={answer.rarity} size="sm" />

        <span
          className="font-mono text-xs font-bold flex-shrink-0"
          style={{
            color: found ? "var(--color-ink)" : "var(--color-dust)",
          }}
        >
          {found ? `+${answer.points}` : answer.points}
        </span>
      </div>

      {/* Submitted guess when different from canonical */}
      {found && guess && guess.toLowerCase() !== answer.display.toLowerCase() && (
        <p
          className="pl-7 text-xs font-mono"
          style={{ color: "var(--color-dust)" }}
        >
          You typed: "{guess}"
          {source === "ai" && <span className="ml-2 opacity-60">· via AI</span>}
        </p>
      )}

      {/* Context note */}
      {answer.context && (
        <p
          className="pl-7 text-xs leading-relaxed font-serif"
          style={{ color: found ? "var(--color-dust)" : "var(--color-dust-border)" }}
        >
          {answer.context}
        </p>
      )}
    </div>
  );
}
