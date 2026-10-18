"use client";

import Link from "next/link";
import { ArrowRight, Timer, Zap } from "lucide-react";
import type { DailyEdition } from "@/lib/types";
import { RARITY_CONFIG, RARITY_ORDER, DEFAULT_ROUND_SECONDS } from "@/lib/config";
import { formatEditionLabel, formatFullDate } from "@/lib/date";
import Button from "@/components/ui/Button";

interface GameIntroProps {
  edition: DailyEdition;
  editionNumber: number;
  onBegin: () => void;
}

export default function GameIntro({ edition, editionNumber, onBegin }: GameIntroProps) {
  const label = formatEditionLabel(edition.date, editionNumber);
  const fullDate = formatFullDate(edition.date);

  return (
    <div className="max-w-content mx-auto px-5 md:px-0 py-10 animate-fade-in">
      {/* Header meta */}
      <div className="flex items-center justify-between mb-8">
        <span className="label-caps">The Daily Cut</span>
        <span className="label-caps">{label}</span>
      </div>

      <div className="rule-heavy mb-8" />

      {/* Title */}
      <h1
        className="font-serif text-4xl md:text-5xl font-black leading-tight mb-3"
        style={{ color: "var(--color-ink)" }}
      >
        {edition.title}
      </h1>
      <p
        className="font-serif italic text-lg mb-8"
        style={{ color: "var(--color-dust)" }}
      >
        {edition.description}
      </p>

      <div className="rule mb-8" />

      {/* Mechanic callout — the core of what makes this different */}
      <div
        className="border-l-4 pl-5 mb-8"
        style={{ borderColor: "var(--color-oxblood)" }}
      >
        <p
          className="font-serif text-xl font-bold leading-snug mb-2"
          style={{ color: "var(--color-ink)" }}
        >
          One prompt. Many valid answers. {DEFAULT_ROUND_SECONDS} seconds.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-dust)" }}>
          Each round gives you a prompt. Submit as many valid answers as you can
          before the timer runs out. The less obvious your answer, the rarer it
          is — and the more points it earns.
        </p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-px mb-8" style={{ backgroundColor: "var(--color-dust-border)" }}>
        <div className="p-5" style={{ backgroundColor: "var(--color-paper)" }}>
          <p className="label-caps mb-1">Rounds</p>
          <p className="font-serif text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
            {edition.questions.length}
          </p>
        </div>
        <div className="p-5" style={{ backgroundColor: "var(--color-paper)" }}>
          <p className="label-caps mb-1">Time per round</p>
          <p className="font-serif text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
            {DEFAULT_ROUND_SECONDS}s
          </p>
        </div>
        <div className="p-5 col-span-2" style={{ backgroundColor: "var(--color-paper)" }}>
          <p className="label-caps mb-1">Edition date</p>
          <p className="text-sm" style={{ color: "var(--color-ink)" }}>
            {fullDate}
          </p>
        </div>
      </div>

      {/* Rules */}
      <div
        className="border p-5 mb-8"
        style={{
          borderColor: "var(--color-dust-border)",
          backgroundColor: "rgba(154,146,127,0.04)",
        }}
      >
        <p className="label-caps mb-3">Rules</p>
        <ul className="space-y-2 text-sm" style={{ color: "var(--color-ink)" }}>
          <li className="flex items-start gap-2">
            <Timer size={12} className="mt-1 flex-shrink-0" style={{ color: "var(--color-dust)" }} />
            The {DEFAULT_ROUND_SECONDS}-second countdown begins the moment you start each round.
          </li>
          <li className="flex items-start gap-2">
            <Zap size={12} className="mt-1 flex-shrink-0" style={{ color: "var(--color-dust)" }} />
            Submit as many valid answers as you can. Each answer has a rarity tier and earns different points.
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight size={12} className="mt-1 flex-shrink-0" style={{ color: "var(--color-dust)" }} />
            Rarer answers earn more. Think beyond the first thing that comes to mind.
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight size={12} className="mt-1 flex-shrink-0" style={{ color: "var(--color-dust)" }} />
            The same answer cannot be counted twice. Spelling variants of the same answer are treated as one.
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight size={12} className="mt-1 flex-shrink-0" style={{ color: "var(--color-dust)" }} />
            After each round, missed answers are revealed with their context.
          </li>
        </ul>
      </div>

      {/* Rarity tiers */}
      <div className="mb-8">
        <p className="label-caps mb-3">The rarity tiers</p>
        <div className="space-y-px" style={{ backgroundColor: "var(--color-dust-border)" }}>
          {RARITY_ORDER.map((tierId) => {
            const config = RARITY_CONFIG[tierId];
            return (
              <div
                key={tierId}
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: "var(--color-paper)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{ width: "8px", height: "8px", backgroundColor: config.dotColor }}
                  />
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="label-caps">{config.shortDesc}</span>
                  <span className="font-mono text-xs" style={{ color: "var(--color-ink)" }}>
                    {config.points} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Button fullWidth size="lg" onClick={onBegin} className="group">
        Begin the Cut
        <ArrowRight size={14} className="ml-3 transition-transform group-hover:translate-x-1" />
      </Button>

      <div className="mt-4 text-center">
        <Link
          href="/settings"
          className="label-caps underline underline-offset-2"
          style={{ color: "var(--color-dust)" }}
        >
          Full rules & scoring explained
        </Link>
      </div>
    </div>
  );
}
