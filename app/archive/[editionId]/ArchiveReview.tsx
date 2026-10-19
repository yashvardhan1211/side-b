"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { DailyEdition, CompletedEdition, RoundState } from "@/lib/types";
import { getCompletedEdition } from "@/lib/storage";
import { getEditionMaxScore } from "@/lib/scoring";
import { RARITY_CONFIG } from "@/lib/config";
import RarityBadge from "@/components/ui/RarityBadge";

interface Props {
  edition: DailyEdition;
  editionNumber: number;
}

export default function ArchiveReview({ edition }: Props) {
  const [completed, setCompleted] = useState<CompletedEdition | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCompleted(getCompletedEdition(edition.id));
    setLoaded(true);
  }, [edition.id]);

  if (!loaded) return null;

  if (!completed) {
    return (
      <div>
        <div
          className="border p-5 mb-6"
          style={{ borderColor: "var(--color-dust-border)", backgroundColor: "rgba(154,146,127,0.05)" }}
        >
          <p className="label-caps mb-2">You haven&apos;t played this edition</p>
          <p className="text-sm mb-4" style={{ color: "var(--color-dust)" }}>
            Review the questions and accepted answers below. Scores are only
            awarded during a live game session. Each edition can only be scored once.
          </p>
        </div>
        <QuestionList edition={edition} rounds={null} />
      </div>
    );
  }

  const maxScore = getEditionMaxScore(edition.questions);

  return (
    <div>
      <div
        className="border p-5 mb-6"
        style={{ borderColor: "var(--color-ink)", backgroundColor: "var(--color-ink)" }}
      >
        <p className="label-caps mb-1" style={{ color: "var(--color-dust)" }}>Your score</p>
        <p className="font-serif text-4xl font-black mb-2" style={{ color: "var(--color-paper)" }}>
          {completed.totalScore}
          <span className="font-normal text-xl ml-2" style={{ color: "var(--color-dust)" }}>
            / {maxScore}
          </span>
        </p>
        <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-oxblood)" }}>
          {completed.totalDiscoveries} answers found across {completed.totalQuestions} rounds
        </p>
      </div>

      <QuestionList edition={edition} rounds={completed.rounds} />
    </div>
  );
}

function QuestionList({
  edition,
  rounds,
}: {
  edition: DailyEdition;
  rounds: RoundState[] | null;
}) {
  return (
    <div className="space-y-4">
      {edition.questions.map((q, i) => {
        const round = rounds?.[i] ?? null;
        const foundIds = new Set(round?.discoveries.map((d) => d.canonicalId) ?? []);
        return (
          <div key={q.id} className="border p-5" style={{ borderColor: "var(--color-dust-border)" }}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="label-caps" style={{ color: "var(--color-oxblood)" }}>
                {q.category}
              </span>
              {round && (
                <span className="ml-auto font-mono text-xs font-bold" style={{ color: "var(--color-ink)" }}>
                  +{round.roundScore}
                </span>
              )}
            </div>

            <p className="font-serif font-bold text-base mb-4" style={{ color: "var(--color-ink)" }}>
              {q.prompt}
            </p>

            {/* Accepted answers list */}
            <div className="space-y-1.5">
              {q.acceptedAnswers
                .sort((a, b) => a.points - b.points)
                .map((answer) => {
                  const found = foundIds.has(answer.id);
                  const _matchedDiscovery = round?.discoveries.find((d) => d.canonicalId === answer.id);
                  return (
                    <div
                      key={answer.id}
                      className="flex items-center gap-3 px-3 py-2"
                      style={{
                        backgroundColor: found ? "rgba(36,36,33,0.04)" : "transparent",
                        borderLeft: `2px solid ${found ? RARITY_CONFIG[answer.rarity]?.dotColor : "var(--color-dust-border)"}`,
                      }}
                    >
                      <div
                        className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: found ? "var(--color-ink)" : "transparent",
                          border: found ? "none" : "1px solid var(--color-dust-border)",
                        }}
                      >
                        {found ? (
                          <Check size={8} color="var(--color-paper)" strokeWidth={3} />
                        ) : (
                          <X size={8} color="var(--color-dust)" strokeWidth={2} />
                        )}
                      </div>
                      <span
                        className="text-sm flex-1 truncate"
                        style={{ color: found ? "var(--color-ink)" : "var(--color-dust)" }}
                      >
                        {answer.display}
                      </span>
                      <RarityBadge tier={answer.rarity} size="sm" />
                      <span className="font-mono text-xs" style={{ color: found ? "var(--color-ink)" : "var(--color-dust)" }}>
                        {found ? `+${answer.points}` : answer.points}
                      </span>
                    </div>
                  );
                })}
            </div>

            <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--color-dust)" }}>
              {q.explanation}
            </p>
          </div>
        );
      })}
    </div>
  );
}
