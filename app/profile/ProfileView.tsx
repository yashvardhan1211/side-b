"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, BarChart2, Target } from "lucide-react";
import { loadPlayerStats } from "@/lib/storage";
import { getRankConfig, getRank } from "@/lib/scoring";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/config";
import { formatEditionLabel } from "@/lib/date";
import { getEditionNumber } from "@/data/editions";
import type { PlayerStats } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import RarityBadge from "@/components/ui/RarityBadge";
import Button from "@/components/ui/Button";

export default function ProfileView() {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    setStats(loadPlayerStats());
  }, []);

  if (!stats) return null;

  if (stats.editionsCompleted === 0) {
    return (
      <EmptyState
        title="No stats yet"
        description="Play your first Daily Cut to start building your profile."
        action={
          <Link href="/play">
            <Button size="md">Play today&apos;s cut</Button>
          </Link>
        }
      />
    );
  }

  // Rarity distribution totals
  const totalDiscoveries = RARITY_ORDER.reduce(
    (sum, id) => sum + (stats.rarityDistribution[id as keyof typeof stats.rarityDistribution] ?? 0),
    0
  );

  // Highest rarity tier the player has ever found
  const topRarityId = RARITY_ORDER.slice().reverse().find(
    (id) => (stats.rarityDistribution[id as keyof typeof stats.rarityDistribution] ?? 0) > 0
  );

  // Derive a rank label from personal best score against a reasonable max
  // (5 questions × 1000 pts each = 5000 possible per edition)
  const EDITION_MAX = 5000;
  const rankConfig = getRankConfig(
    stats.personalBest > 0 ? getRank(stats.personalBest, EDITION_MAX) : "on-repeat"
  );

  return (
    <div>
      {/* Profile header — derived from stats, not hardcoded */}
      <h1
        className="font-serif text-3xl md:text-4xl font-black mb-1"
        style={{ color: "var(--color-ink)" }}
      >
        {rankConfig.label}
      </h1>
      <p className="label-caps mb-8" style={{ color: "var(--color-dust)" }}>
        {stats.editionsCompleted} cut{stats.editionsCompleted !== 1 ? "s" : ""} played
      </p>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-px mb-10"
        style={{ backgroundColor: "var(--color-dust-border)" }}
      >
        <StatCell
          icon={<Flame size={14} style={{ color: "var(--color-oxblood)" }} />}
          label="Current streak"
          value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? "s" : ""}`}
        />
        <StatCell
          icon={<Target size={14} style={{ color: "var(--color-oxblood)" }} />}
          label="Personal best"
          value={stats.personalBest > 0 ? String(stats.personalBest) : "—"}
        />
        <StatCell
          icon={<BarChart2 size={14} style={{ color: "var(--color-oxblood)" }} />}
          label="Cuts completed"
          value={String(stats.editionsCompleted)}
        />
        <StatCell
          icon={
            <span
              className="inline-block rounded-full flex-shrink-0"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: topRarityId
                  ? RARITY_CONFIG[topRarityId].dotColor
                  : "var(--color-dust)",
              }}
            />
          }
          label="Rarest tier found"
          value={topRarityId ? RARITY_CONFIG[topRarityId].label : "—"}
        />
      </div>

      {/* Rarity distribution */}
      <div className="mb-10">
        <p className="label-caps mb-4">Your rarity mix</p>
        <div className="space-y-3">
          {RARITY_ORDER.map((id) => {
            const count =
              stats.rarityDistribution[id as keyof typeof stats.rarityDistribution] ?? 0;
            const pct =
              totalDiscoveries > 0 ? Math.round((count / totalDiscoveries) * 100) : 0;
            const config = RARITY_CONFIG[id];
            return (
              <div key={id} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <RarityBadge tier={id as Parameters<typeof RarityBadge>[0]["tier"]} size="sm" />
                </div>
                <div
                  className="flex-1 h-1.5"
                  style={{ backgroundColor: "var(--color-dust-border)" }}
                >
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: config.dotColor }}
                  />
                </div>
                <span
                  className="font-mono text-xs w-8 text-right"
                  style={{ color: "var(--color-dust)" }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent results */}
      {stats.recentResults.length > 0 && (
        <div className="mb-8">
          <p className="label-caps mb-4">Recent cuts</p>
          <div className="space-y-px" style={{ backgroundColor: "var(--color-dust-border)" }}>
            {stats.recentResults.slice(0, 5).map((r) => {
              const rankCfg = getRankConfig(r.rank);
              const edNumber = getEditionNumber(r.editionId);
              const lbl = formatEditionLabel(r.date, edNumber);
              return (
                <Link
                  key={r.editionId}
                  href={`/archive/${r.editionId}`}
                  className="flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "var(--color-paper)" }}
                >
                  <div>
                    <p className="label-caps mb-0.5">{lbl}</p>
                    <p className="font-mono text-xs" style={{ color: "var(--color-ink)" }}>
                      {r.totalScore} pts &middot; {rankCfg.label}
                    </p>
                  </div>
                  <p className="font-mono text-xs" style={{ color: "var(--color-dust)" }}>
                    {r.totalDiscoveries} found
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Account CTA */}
      <div className="border p-6 text-center" style={{ borderColor: "var(--color-dust-border)" }}>
        <h3 className="font-serif text-xl font-bold mb-2" style={{ color: "var(--color-ink)" }}>
          Keep your place.
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--color-dust)" }}>
          Save your streak, stats and history across devices. Account sync is coming soon.
        </p>
        <p className="label-caps" style={{ color: "var(--color-dust)" }}>
          Your data is stored locally in this browser.
        </p>
      </div>
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-5" style={{ backgroundColor: "var(--color-paper)" }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="label-caps">{label}</p>
      </div>
      <p className="font-serif text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
        {value}
      </p>
    </div>
  );
}
