"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Trophy, BarChart2, Target, Calendar } from "lucide-react";
import { loadPlayerStats } from "@/lib/storage";
import { getRankConfig } from "@/lib/scoring";
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
            <Button size="md">Play today's cut</Button>
          </Link>
        }
      />
    );
  }

  // Rarity distribution totals
  const totalCorrect = RARITY_ORDER.reduce(
    (sum, id) => sum + (stats.rarityDistribution[id as keyof typeof stats.rarityDistribution] ?? 0),
    0
  );

  const avgScore =
    stats.editionsCompleted > 0
      ? Math.round(stats.totalScore / stats.editionsCompleted)
      : 0;

  // Most common rarity tier
  const topRarityId = RARITY_ORDER.slice().reverse().find(
    (id) => (stats.rarityDistribution[id as keyof typeof stats.rarityDistribution] ?? 0) > 0
  );

  return (
    <div>
      <h1
        className="font-serif text-3xl md:text-4xl font-black mb-1"
        style={{ color: "var(--color-ink)" }}
      >
        The Crate Digger
      </h1>
      <p className="label-caps mb-8" style={{ color: "var(--color-dust)" }}>
        Member since 2026
      </p>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-px mb-10"
        style={{ backgroundColor: "var(--color-dust-border)" }}
      >
        <StatCell
          icon={<Flame size={14} style={{ color: "var(--color-oxblood)" }} />}
          label="Current streak"
          value={`${stats.currentStreak} days`}
        />
        <StatCell
          icon={<Trophy size={14} style={{ color: "var(--color-oxblood)" }} />}
          label="Personal best"
          value={String(stats.personalBest)}
        />
        <StatCell
          icon={<Target size={14} style={{ color: "var(--color-oxblood)" }} />}
          label="Cuts completed"
          value={String(stats.editionsCompleted)}
        />
        <StatCell
          icon={<BarChart2 size={14} style={{ color: "var(--color-oxblood)" }} />}
          label="Rarest tier"
          value={
            topRarityId
              ? RARITY_CONFIG[topRarityId].label
              : "—"
          }
        />
      </div>

      {/* Rarity distribution */}
      <div className="mb-10">
        <p className="label-caps mb-4">Your rarity mix</p>
        <div className="space-y-3">
          {RARITY_ORDER.map((id) => {
            const count = stats.rarityDistribution[id as keyof typeof stats.rarityDistribution] ?? 0;
            const pct = totalCorrect > 0 ? Math.round((count / totalCorrect) * 100) : 0;
            const config = RARITY_CONFIG[id];
            return (
              <div key={id} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <RarityBadge tier={id as any} size="sm" />
                </div>
                <div
                  className="flex-1 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--color-dust-border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: config.dotColor,
                    }}
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
          <div
            className="space-y-px"
            style={{ backgroundColor: "var(--color-dust-border)" }}
          >
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
                    <p
                      className="font-mono text-xs"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {r.totalScore} pts · {rankCfg.label}
                    </p>
                  </div>
                  <p
                    className="font-mono text-xs"
                    style={{ color: "var(--color-dust)" }}
                  >
                    {r.totalDiscoveries} answers found
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sign in CTA */}
      <div
        className="border p-6 text-center"
        style={{ borderColor: "var(--color-dust-border)" }}
      >
        <h3
          className="font-serif text-xl font-bold mb-2"
          style={{ color: "var(--color-ink)" }}
        >
          Keep your place.
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--color-dust)" }}>
          Save your streak, stats and history across devices. Account features
          are coming soon.
        </p>
        <p className="label-caps" style={{ color: "var(--color-dust)" }}>
          Your data is safe with us — stored locally for now.
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
      <p
        className="font-serif text-2xl font-bold"
        style={{ color: "var(--color-ink)" }}
      >
        {value}
      </p>
    </div>
  );
}
