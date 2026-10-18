import Link from "next/link";
import { ArrowRight, Flame, Trophy, BookOpen } from "lucide-react";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/config";
import { formatEditionLabel } from "@/lib/date";
import { getEditionById, getEditionNumber } from "@/data/editions";
import { getFeaturedNote } from "@/data/notes";
import HomeStatsBar from "./HomeStatsBar";

// Hard-coded today for demo; in production use getTodayEditionId()
const TODAY_EDITION_ID = "2026-10-18";

export default function HomePage() {
  const todayEdition = getEditionById(TODAY_EDITION_ID);
  const editionNumber = todayEdition ? getEditionNumber(TODAY_EDITION_ID) : 0;
  const label = todayEdition ? formatEditionLabel(TODAY_EDITION_ID, editionNumber) : "";
  const featuredNote = getFeaturedNote();

  return (
    <div className="flex-1">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        className="border-b"
        style={{ borderColor: "var(--color-dust-border)" }}
      >
        <div className="max-w-wide mx-auto px-5 md:px-8 pt-10 pb-0">
          {/* Wordmark row */}
          <div className="flex items-baseline justify-between mb-1">
            <div>
              <h1
                className="font-serif font-black text-5xl md:text-7xl leading-none tracking-tight"
                style={{ color: "var(--color-ink)" }}
              >
                SIDE B
              </h1>
              <p
                className="font-mono text-xs tracking-widest uppercase mt-1"
                style={{ color: "var(--color-dust)", letterSpacing: "0.18em" }}
              >
                India, beyond the obvious.
              </p>
            </div>
            {label && (
              <div className="hidden md:block text-right">
                <p className="label-caps">Today</p>
                <p
                  className="font-mono text-sm"
                  style={{ color: "var(--color-ink)" }}
                >
                  {label}
                </p>
              </div>
            )}
          </div>

          {/* Rule */}
          <div className="rule-heavy mt-6 mb-8" />

          {/* Hero editorial */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start pb-10">
            <div>
              <p
                className="label-caps mb-3"
                style={{ color: "var(--color-oxblood)" }}
              >
                The Daily Cut
              </p>
              <h2
                className="font-serif text-3xl md:text-4xl font-bold leading-snug mb-4"
                style={{ color: "var(--color-ink)" }}
              >
                You know India.
                <br />
                <em>But do you really?</em>
              </h2>
              <p
                className="text-sm leading-relaxed mb-8 max-w-prose-sm"
                style={{ color: "var(--color-dust)" }}
              >
                Five questions. Every day. The less common your answer, the
                rarer your score. An independent rarity game built around Indian
                music, cinema, internet history, food, and the things everyone
                almost knows.
              </p>

              {/* Stats bar */}
              <HomeStatsBar />

              {/* Primary CTA */}
              {todayEdition ? (
                <Link href="/play" className="block mt-6">
                  <button
                    className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 font-mono text-xs tracking-widest uppercase transition-opacity hover:opacity-85"
                    style={{
                      backgroundColor: "var(--color-ink)",
                      color: "var(--color-paper)",
                      borderRadius: "2px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Play today's cut
                    <ArrowRight size={14} />
                  </button>
                </Link>
              ) : (
                <div
                  className="border p-4 mt-6"
                  style={{ borderColor: "var(--color-dust-border)" }}
                >
                  <p className="label-caps mb-1">No edition today</p>
                  <p className="text-sm" style={{ color: "var(--color-dust)" }}>
                    Check back tomorrow. In the meantime, explore the archive.
                  </p>
                </div>
              )}
            </div>

            {/* Rarity preview column */}
            <div>
              <p className="label-caps mb-4">The rarity tiers</p>
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
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: config.dotColor,
                          }}
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
                        <span
                          className="font-mono text-xs"
                          style={{ color: "var(--color-ink)" }}
                        >
                          {config.points} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p
                className="text-xs mt-3 leading-relaxed"
                style={{ color: "var(--color-dust)" }}
              >
                Rarity reflects the obscurity of the answer — the less common
                your valid answer, the higher your score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Notes preview ───────────────────────────────────── */}
      {featuredNote && (
        <section
          className="border-b"
          style={{ borderColor: "var(--color-dust-border)" }}
        >
          <div className="max-w-wide mx-auto px-5 md:px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen size={14} style={{ color: "var(--color-dust)" }} />
                <span className="label-caps">SIDE B Notes</span>
              </div>
              <Link
                href="/notes"
                className="label-caps underline underline-offset-2 hover:opacity-60 transition-opacity"
              >
                All stories →
              </Link>
            </div>

            <Link href={`/notes/${featuredNote.slug}`} className="group block">
              <div className="grid md:grid-cols-3 gap-6 md:gap-12 items-start">
                {/* Placeholder image area */}
                <div
                  className="md:col-span-1 aspect-video flex items-end p-4"
                  style={{
                    backgroundColor: "var(--color-ink)",
                  }}
                >
                  <span
                    className="label-caps"
                    style={{ color: "var(--color-dust)" }}
                  >
                    Field Journal 001
                  </span>
                </div>
                <div className="md:col-span-2">
                  <p
                    className="label-caps mb-2"
                    style={{ color: "var(--color-oxblood)" }}
                  >
                    {featuredNote.category.toUpperCase()} · {featuredNote.readingTime} MIN READ
                  </p>
                  <h3
                    className="font-serif text-2xl md:text-3xl font-bold leading-snug mb-3 group-hover:opacity-70 transition-opacity"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {featuredNote.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: "var(--color-dust)" }}
                  >
                    {featuredNote.subtitle}
                  </p>
                  <span
                    className="label-caps underline underline-offset-2"
                    style={{ color: "var(--color-ink)" }}
                  >
                    Read more →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Goods preview ───────────────────────────────────── */}
      <section className="border-b" style={{ borderColor: "var(--color-dust-border)" }}>
        <div className="max-w-wide mx-auto px-5 md:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <span className="label-caps">SIDE B Goods</span>
            <Link
              href="/goods"
              className="label-caps underline underline-offset-2 hover:opacity-60 transition-opacity"
            >
              View collection →
            </Link>
          </div>

          <Link href="/goods" className="group block">
            <div className="flex gap-6 items-center">
              {/* Placeholder tee graphic */}
              <div
                className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "#1a1a18" }}
              >
                <p
                  className="font-serif font-black text-lg text-center leading-none"
                  style={{ color: "rgba(242,235,221,0.7)" }}
                >
                  SB
                </p>
              </div>
              <div>
                <p className="label-caps mb-1" style={{ color: "var(--color-oxblood)" }}>
                  FIRST PRESS 001 — PREORDER
                </p>
                <h3
                  className="font-serif text-xl md:text-2xl font-bold mb-2 group-hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-ink)" }}
                >
                  First Press 001 Tee
                </h3>
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--color-dust)" }}
                >
                  Oversized washed-black. A study in things overlooked.
                </p>
                <p
                  className="font-mono text-sm font-medium"
                  style={{ color: "var(--color-ink)" }}
                >
                  ₹999
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
