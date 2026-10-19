"use client";

import { X } from "lucide-react";
import type { CompletedEdition, RarityTier } from "@/lib/types";
import { RARITY_CONFIG } from "@/lib/config";

interface ShareCardProps {
  completed: CompletedEdition;
  rankLabel: string;
  editionLabel: string;
  onClose: () => void;
}

export default function ShareCard({ completed, rankLabel, editionLabel, onClose }: ShareCardProps) {
  const rarityMap: Record<string, string> = {
    "the-hit": "⬜", "radio-rotation": "🟩", "b-side": "🟦",
    "crate-find": "🟪", "cult-favourite": "🟥", "deep-vault": "⬛",
  };

  const tileText = completed.rounds
    .map((r) => {
      if (r.discoveries.length === 0) return "✕";
      const best = [...r.discoveries].sort((a, b) => b.points - a.points)[0]?.rarity;
      return rarityMap[best ?? "the-hit"] ?? "⬜";
    })
    .join("");

  const handleCopy = async () => {
    const text = `SIDE B — The Daily Cut\n${editionLabel}\n\n${completed.totalScore} pts · ${rankLabel}\n${tileText}\n\nIndia, beyond the obvious.\nsideb.in/play`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {}
  };

  const tiles = completed.rounds.map((r) => {
    if (r.discoveries.length === 0) return null;
    const bestRarity = [...r.discoveries].sort((a, b) => b.points - a.points)[0]?.rarity as RarityTier;
    const config = RARITY_CONFIG[bestRarity];
    return { rarity: bestRarity, config, count: r.discoveries.length };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(36,36,33,0.85)" }}
    >
      <div
        className="relative w-full max-w-sm p-8"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-paper)" }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100" aria-label="Close">
          <X size={16} color="var(--color-paper)" />
        </button>

        <p className="font-mono text-2xs tracking-widest uppercase mb-1" style={{ color: "var(--color-dust)" }}>{editionLabel}</p>
        <p className="font-serif text-2xl font-black mb-1">SIDE B</p>
        <p className="font-mono text-xs tracking-widest uppercase mb-6" style={{ color: "var(--color-dust)" }}>The Daily Cut</p>

        <p className="font-serif text-5xl font-black mb-1" style={{ color: "var(--color-paper)" }}>{completed.totalScore}</p>
        <p className="font-mono text-xs tracking-widest uppercase mb-6" style={{ color: "var(--color-oxblood)" }}>
          {rankLabel} · {completed.totalDiscoveries} answers
        </p>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tiles.map((tile, idx) => (
            <div
              key={idx}
              className="w-9 h-9 flex items-center justify-center"
              style={{
                backgroundColor: tile?.config?.dotColor ? tile.config.dotColor + "33" : "rgba(255,255,255,0.06)",
                border: `1px solid ${tile?.config?.dotColor ?? "rgba(255,255,255,0.1)"}`,
              }}
              title={`Round ${idx + 1}: ${tile?.count ?? 0} answers`}
            >
              {!tile
                ? <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>✕</span>
                : <span className="font-mono text-xs font-bold" style={{ color: tile.config?.dotColor }}>{tile.count}</span>
              }
            </div>
          ))}
        </div>

        <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--color-dust)" }}>India, beyond the obvious.</p>

        <button
          onClick={handleCopy}
          className="mt-6 w-full py-3 font-mono text-xs tracking-widest uppercase text-center transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-oxblood)", color: "var(--color-paper)" }}
        >
          Copy results text
        </button>
      </div>
    </div>
  );
}
