import type { Metadata } from "next";
import { SAMPLE_EDITIONS, getEditionNumber } from "@/data/editions";
import { formatEditionLabel } from "@/lib/date";
import ArchiveList from "./ArchiveList";

export const metadata: Metadata = {
  title: "The Archive",
  description: "Every edition of The Daily Cut, from the beginning.",
};

export default function ArchivePage() {
  const sorted = [...SAMPLE_EDITIONS].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const editionsData = sorted.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    description: e.description,
    questionCount: e.questions.length,
    editionNumber: getEditionNumber(e.id),
    label: formatEditionLabel(e.date, getEditionNumber(e.id)),
    fullDate: e.date,
  }));

  return (
    <div className="flex-1">
      <div className="max-w-wide mx-auto px-5 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-2">
          <span className="label-caps">The Archive</span>
          <span className="label-caps">{SAMPLE_EDITIONS.length} editions</span>
        </div>
        <div className="rule-heavy mb-6" />

        <h1
          className="font-serif text-4xl md:text-5xl font-black mb-3"
          style={{ color: "var(--color-ink)" }}
        >
          Every edition leaves a little evidence behind.
        </h1>
        <p
          className="text-sm mb-8 max-w-prose-sm"
          style={{ color: "var(--color-dust)" }}
        >
          Browse all past editions. Completed editions show your score. Missed
          editions are playable for review — scores are not awarded for
          completed replays.
        </p>

        {/* Tab filter */}
        <ArchiveList editions={editionsData} />
      </div>
    </div>
  );
}
