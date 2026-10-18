"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import {
  loadCompletedEditions,
  isEditionCompleted,
  getCompletedEdition,
} from "@/lib/storage";
import type { CompletedEdition } from "@/lib/types";
import { RARITY_CONFIG } from "@/lib/config";

interface EditionMeta {
  id: string;
  date: string;
  title: string;
  description: string;
  questionCount: number;
  editionNumber: number;
  label: string;
  fullDate: string;
}

interface ArchiveListProps {
  editions: EditionMeta[];
}

type FilterTab = "all" | "played" | "missed";

const TODAY_ID = "2026-10-18";

export default function ArchiveList({ editions }: ArchiveListProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [completedMap, setCompletedMap] = useState<Map<string, CompletedEdition>>(new Map());

  useEffect(() => {
    const completed = loadCompletedEditions();
    const map = new Map(completed.map((c) => [c.editionId, c]));
    setCompletedMap(map);
  }, []);

  const filtered = editions.filter((e) => {
    const done = completedMap.has(e.id);
    if (filter === "played") return done;
    if (filter === "missed") return !done && e.id !== TODAY_ID;
    return true;
  });

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all",    label: "All"    },
    { id: "played", label: "Played" },
    { id: "missed", label: "Missed" },
  ];

  return (
    <>
      {/* Tab row */}
      <div
        className="flex gap-px mb-6"
        style={{ backgroundColor: "var(--color-dust-border)" }}
        role="tablist"
        aria-label="Filter editions"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className="flex-1 py-2.5 font-mono text-xs tracking-widest uppercase transition-colors"
            style={{
              backgroundColor:
                filter === id ? "var(--color-ink)" : "var(--color-paper)",
              color:
                filter === id ? "var(--color-paper)" : "var(--color-dust)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Edition list */}
      {filtered.length === 0 ? (
        <div
          className="border p-8 text-center"
          style={{ borderColor: "var(--color-dust-border)", borderStyle: "dashed" }}
        >
          <p className="label-caps">No editions here yet</p>
          <p className="text-sm mt-2" style={{ color: "var(--color-dust)" }}>
            {filter === "played"
              ? "You haven't completed any editions yet. Go play today's cut."
              : "Nothing missed. Great work."}
          </p>
        </div>
      ) : (
        <div className="space-y-px" style={{ backgroundColor: "var(--color-dust-border)" }}>
          {filtered.map((e) => {
            const completed = completedMap.get(e.id);
            const isToday = e.id === TODAY_ID;

            return (
              <Link
                key={e.id}
                href={isToday ? "/play" : `/archive/${e.id}`}
                className="flex items-center justify-between px-4 py-4 group transition-colors hover:bg-dust-light"
                style={{ backgroundColor: "var(--color-paper)" }}
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Status dot */}
                  <div className="flex-shrink-0 mt-1">
                    {completed ? (
                      <div
                        className="w-5 h-5 flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-ink)" }}
                      >
                        <Check size={10} color="var(--color-paper)" />
                      </div>
                    ) : (
                      <div
                        className="w-5 h-5 border flex items-center justify-center"
                        style={{ borderColor: "var(--color-dust-border)" }}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="label-caps mb-0.5">{e.label}</p>
                    <p
                      className="font-serif font-bold text-base leading-snug truncate"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {e.title}
                    </p>
                    {completed ? (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--color-dust)" }}
                      >
                        {completed.totalScore} pts ·{" "}
                        {completed.totalDiscoveries} answers found
                      </p>
                    ) : (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--color-dust)" }}
                      >
                        {e.questionCount} questions
                        {isToday ? " · Today's edition" : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="label-caps ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--color-dust)" }}
                >
                  {completed ? "Review" : isToday ? "Play" : "Play →"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
