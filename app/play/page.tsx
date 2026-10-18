import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEditionById, getEditionNumber } from "@/data/editions";
import GameEngine from "@/components/game/GameEngine";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "The Daily Cut",
  description: "Play today's edition of The Daily Cut.",
};

// In production, derive from getTodayEditionId()
const TODAY_EDITION_ID = "2026-10-18";

export default function PlayPage() {
  const edition = getEditionById(TODAY_EDITION_ID);
  const editionNumber = edition ? getEditionNumber(TODAY_EDITION_ID) : 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Game shell */}
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

        {edition ? (
          <GameEngine edition={edition} editionNumber={editionNumber} />
        ) : (
          <div className="px-5 py-16">
            <EmptyState
              title="No edition today"
              description="There's no new Daily Cut for today. Check back tomorrow, or explore past editions in the archive."
              action={
                <Link href="/archive">
                  <Button variant="secondary" size="md">
                    Browse archive →
                  </Button>
                </Link>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
