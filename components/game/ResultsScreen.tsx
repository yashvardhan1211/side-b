"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, ArrowRight } from "lucide-react";
import type { DailyEdition, CompletedEdition } from "@/lib/types";
import { getCompletedEdition } from "@/lib/storage";
import { getRankConfig, getEditionMaxScore } from "@/lib/scoring";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/config";
import { formatEditionLabel } from "@/lib/date";
import RarityBadge from "@/components/ui/RarityBadge";
import Button from "@/components/ui/Button";
import ShareCard from "./ShareCard";

interface ResultsScreenProps {
  edition: DailyEdition;
  editionNumber: number;
  isToday: boolean;
}

const CLOSING_MESSAGES = [
  "Keep looking beyond the obvious.",
  "Every answer is a door left ajar.",
  "The B-side is always worth the flip.",
  "Same curiosity. New side.",
];

export default function ResultsScreen({ edition, editionNumber, isToday }: ResultsScreenProps) {
  const [completed, setCompleted] = useState<CompletedEdition | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    setCompleted(getCompletedEdition(edition.id));
  }, [edition.id]);

  if (!completed) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="label-caps animate-pulse">Loading results...</span>
      </div>
    );
  }

  const rankConfig = getRankConfig(completed.rank);
  const label = formatEditionLabel(edition.date, editionNumber);
  const maxScore = getEditionMaxScore(edition.questions);
  const closingMessage = CLOSING_MESSAGES[editionNumber % CLOSING_MESSAGES.length];

  // All discoveries across all rounds, sorted by points desc
  const allDiscoveries = completed.rounds
    .flatMap((r) => r.discoveries)
    .sort((a, b) => b.points - a.points);

  // Rarity breakdown
  const rarityBreakdown: Record<string, number> = {};
  for (const d of allDiscoveries) {
    rarityBreakdown[d.rarity] = (rarityBreakdown[d.rarity] ?? 0) + 1;
  }

  const handleShare = async () => {
    const shareText = buildShareText(completed, rankConfig, label, edition);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "SIDE B — The Daily Cut", text: shareText });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Results copied to clipboard!");
    } catch {
      setShareVisible(true);
    }
  };

  return (
    <div className="max-w-content mx-auto px-5 md:px-0 py-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="label-caps">The Daily Cut is complete</span>
        <span className="label-caps">{label}</span>
      </div>

      <div className="rule-heavy mb-6" />

      {/* Rank headline */}
      <h1
        className="font-serif text-4xl md:text-5xl font-black leading-tight mb-2"
        style={{ color: "var(--color-ink)" }}
      >
        {rankConfig.description}
      </h1>
      <p className="font-serif italic text-lg mb-8" style={{ color: "var(--color-dust)" }}>
        {closingMessage}
      </p>

      {/* Score card */}
      <div
        className="border p-6 mb-6"
        style={{ borderColor: "var(--color-ink)", backgroundColor: "var(--color-ink)" }}
      >
        <p className="label-caps mb-2" style={{ color: "var(--color-dust)" }}>
          Your total score
        </p>
        <p
          className="font-serif text-5xl font-black mb-2"
          style={{ color: "var(--color-paper)" }}
        >
          {completed.totalScore}
          <span className="font-normal text-2xl ml-2" style={{ color: "var(--color-dust)" }}>
            / {maxScore}
          </span>
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-xs tracking-widest uppercase px-2 py-1"
            style={{ backgroundColor: "rgba(242,235,221,0.1)", color: "var(--color-paper)" }}
          >
            {completed.totalDiscoveries} answers found
          </span>
          <span
            className="font-mono text-xs tracking-widest uppercase px-2 py-1"
            style={{ backgroundColor: "var(--color-oxblood)", color: "var(--color-paper)" }}
          >
            {rankConfig.label}
          </span>
        </div>
      </div>

      {/* Per-round tracklist */}
      <div className="mb-8">
        <p className="label-caps mb-3">Your tracklist</p>
        <div className="space-y-px" style={{ backgroundColor: "var(--color-dust-border)" }}>
          {completed.rounds.map((round, i) => {
            const q = edition.questions[i];
            return (
              <div
                key={round.questionId}
                className="flex items-center justify-between px-4 py-3 gap-3"
                style={{ backgroundColor: "var(--color-paper)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs flex-shrink-0" style={{ color: "var(--color-dust)", minWidth: "1.5rem" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm truncate" style={{ color: "var(--color-ink)" }}>
                    {q?.category ?? "Round"}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-xs" style={{ color: "var(--color-dust)" }}>
                    {round.discoveries.length} found
                  </span>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--color-ink)" }}
                  >
                    +{round.roundScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top discoveries */}
      {allDiscoveries.length > 0 && (
        <div className="mb-8">
          <p className="label-caps mb-3">Best discoveries</p>
          <div className="space-y-1.5">
            {allDiscoveries.slice(0, 5).map((d) => (
              <div
                key={d.canonicalId + d.submittedAt}
                className="flex items-center gap-3 px-3 py-2"
                style={{
                  backgroundColor: "rgba(36,36,33,0.04)",
                  borderLeft: `2px solid ${RARITY_CONFIG[d.rarity]?.dotColor ?? "#9A927F"}`,
                }}
              >
                <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-ink)" }}>
                  {d.display}
                </span>
                <RarityBadge tier={d.rarity} size="sm" />
                <span className="font-mono text-xs font-bold" style={{ color: "var(--color-ink)" }}>
                  +{d.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 mb-8">
        <Button fullWidth size="lg" onClick={handleShare} className="group">
          <Share2 size={14} className="mr-2" />
          Share your score
        </Button>
        <Link href="/archive" className="block">
          <Button fullWidth variant="secondary" size="md">
            See the archive <ArrowRight size={12} className="ml-2" />
          </Button>
        </Link>
      </div>

      {shareVisible && (
        <ShareCard
          completed={completed}
          rankLabel={rankConfig.label}
          editionLabel={label}
          questions={edition.questions}
          onClose={() => setShareVisible(false)}
        />
      )}

      {/* Next edition */}
      <div className="rule pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-caps mb-1">Next edition</p>
            <p className="text-sm" style={{ color: "var(--color-dust)" }}>
              A new cut drops every day.
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">Home →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function buildShareText(
  completed: CompletedEdition,
  rankConfig: ReturnType<typeof getRankConfig>,
  label: string,
  edition: DailyEdition
): string {
  const rarityMap: Record<string, string> = {
    "the-hit": "⬜", "radio-rotation": "🟩", "b-side": "🟦",
    "crate-find": "🟪", "cult-favourite": "🟥", "deep-vault": "⬛",
  };

  // One tile per round, colored by best rarity found (or ✕ if none)
  const tiles = completed.rounds
    .map((r) => {
      if (r.discoveries.length === 0) return "✕";
      const bestRarity = [...r.discoveries].sort(
        (a, b) => b.points - a.points
      )[0]?.rarity;
      return rarityMap[bestRarity ?? "the-hit"] ?? "⬜";
    })
    .join("");

  return `SIDE B — The Daily Cut\n${label}\n\n${completed.totalScore} pts · ${rankConfig.label}\n${tiles}\n\nIndia, beyond the obvious.\nsideb.in/play`;
}
