import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEditionById, getEditionNumber, getMostRecentEdition } from "@/data/editions";
import { getTodayEditionId } from "@/lib/date";
import GameEngine from "@/components/game/GameEngine";

export const metadata: Metadata = {
  title: "The Daily Cut",
  description: "Play today's edition of The Daily Cut.",
};

export default function PlayPage() {
  const todayId = getTodayEditionId();

  // Use today's edition if it exists; otherwise fall back to the most recent one.
  // This prevents "No edition today" when content hasn't been updated for the new date.
  const edition = getEditionById(todayId) ?? getMostRecentEdition();
  const editionNumber = getEditionNumber(edition.id);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-content mx-auto w-full px-0 md:px-0">
        {/* Mobile back link */}
        <div className="md:hidden px-5 pt-4 flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 label-caps hover:opacity-60 transition-opacity"
            style={{ color: "var(--color-dust)" }}
          >
            <ArrowLeft size={12} />
            Home
          </Link>
        </div>

        <GameEngine edition={edition} editionNumber={editionNumber} />
      </div>
    </div>
  );
}
