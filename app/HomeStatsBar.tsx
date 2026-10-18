"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, BarChart2 } from "lucide-react";
import { loadPlayerStats } from "@/lib/storage";
import type { PlayerStats } from "@/lib/types";

export default function HomeStatsBar() {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    const s = loadPlayerStats();
    setStats(s);
  }, []);

  if (!stats || stats.editionsCompleted === 0) return null;

  return (
    <div
      className="flex gap-6 flex-wrap"
      role="status"
      aria-label="Your stats"
    >
      <div className="flex items-center gap-2">
        <Flame size={14} style={{ color: "var(--color-oxblood)" }} />
        <div>
          <p className="label-caps">Streak</p>
          <p className="font-mono text-base font-medium" style={{ color: "var(--color-ink)" }}>
            {stats.currentStreak}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Trophy size={14} style={{ color: "var(--color-oxblood)" }} />
        <div>
          <p className="label-caps">Best score</p>
          <p className="font-mono text-base font-medium" style={{ color: "var(--color-ink)" }}>
            {stats.personalBest}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <BarChart2 size={14} style={{ color: "var(--color-oxblood)" }} />
        <div>
          <p className="label-caps">Cuts played</p>
          <p className="font-mono text-base font-medium" style={{ color: "var(--color-ink)" }}>
            {stats.editionsCompleted}
          </p>
        </div>
      </div>
    </div>
  );
}
