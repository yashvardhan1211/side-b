import type { Metadata } from "next";
import { RARITY_CONFIG, RARITY_ORDER, RANK_CONFIG } from "@/lib/config";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Rules & Help",
  description: "How SIDE B works — rarity tiers, scoring, and more.",
};

export default function SettingsPage() {
  return (
    <div className="flex-1">
      <div className="max-w-content mx-auto px-5 md:px-8 py-10">
        <span className="label-caps block mb-2">Settings & Help</span>
        <div className="rule-heavy mb-8" />

        {/* Game rules */}
        <section id="rules" className="mb-10">
          <h2
            className="font-serif text-2xl font-bold mb-4"
            style={{ color: "var(--color-ink)" }}
          >
            Game rules
          </h2>
          <div className="space-y-2 text-sm" style={{ color: "var(--color-ink)" }}>
            <p>— One guess per question. Submit carefully.</p>
            <p>— Spelling is normalised. Punctuation, capitalisation, and extra spaces are ignored.</p>
            <p>— Accepted alternate answers are listed where applicable.</p>
            <p>— A hint is available before submission. Using a hint does not affect your score.</p>
            <p>— Each question has a rarity tier. Rarer correct answers earn more points.</p>
            <p>— An edition is five questions. Your score and rank are shown at the end.</p>
            <p>— A new edition drops every day (Indian Standard Time).</p>
            <p>— A completed edition cannot award the same score again.</p>
          </div>
        </section>

        {/* Rarity tiers */}
        <section id="rarity" className="mb-10">
          <h2
            className="font-serif text-2xl font-bold mb-4"
            style={{ color: "var(--color-ink)" }}
          >
            Rarity tiers
          </h2>
          <div
            className="space-y-px"
            style={{ backgroundColor: "var(--color-dust-border)" }}
          >
            {RARITY_ORDER.map((id) => {
              const config = RARITY_CONFIG[id];
              return (
                <div
                  key={id}
                  className="p-4"
                  style={{ backgroundColor: "var(--color-paper)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block rounded-full"
                        style={{
                          width: "8px",
                          height: "8px",
                          backgroundColor: config.dotColor,
                        }}
                      />
                      <span
                        className="font-mono text-sm font-medium"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="label-caps">{config.shortDesc}</span>
                      <span
                        className="font-mono text-sm"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {config.points} pts
                      </span>
                    </div>
                  </div>
                  <p className="text-sm pl-5" style={{ color: "var(--color-dust)" }}>
                    {config.description}
                  </p>
                </div>
              );
            })}
          </div>
          <p
            className="text-xs mt-3 leading-relaxed"
            style={{ color: "var(--color-dust)" }}
          >
            Rarity is assigned by the editors. It reflects editorial judgement
            about the obscurity of a valid answer, not a statistical measure.
          </p>
        </section>

        {/* Scoring */}
        <section id="scoring" className="mb-10">
          <h2
            className="font-serif text-2xl font-bold mb-4"
            style={{ color: "var(--color-ink)" }}
          >
            How scoring works
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-dust)" }}>
            Each correct answer earns the points assigned to its rarity tier.
            An incorrect answer earns zero points. Your final score is the sum
            of all points earned across the five questions.
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--color-dust)" }}>
            Your rank is determined by your score as a percentage of the maximum
            possible score for that edition.
          </p>
          <div
            className="space-y-px mb-4"
            style={{ backgroundColor: "var(--color-dust-border)" }}
          >
            {RANK_CONFIG.map((rank) => (
              <div
                key={rank.id}
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: "var(--color-paper)" }}
              >
                <div>
                  <p
                    className="font-mono text-sm font-medium"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {rank.label}
                  </p>
                  <p className="label-caps">{rank.description}</p>
                </div>
                <span className="label-caps">≥{rank.minPercent}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-10">
          <h2
            className="font-serif text-2xl font-bold mb-4"
            style={{ color: "var(--color-ink)" }}
          >
            FAQ
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "My correct answer wasn't accepted. What should I do?",
                a: "Spelling variations and common alternate names are accepted where configured. If you believe a valid answer was rejected, use the report form below.",
              },
              {
                q: "Will I lose my progress if I close the browser?",
                a: "No. Your progress is saved locally as you play. Refreshing or closing the tab will not erase an unfinished game.",
              },
              {
                q: "Can I play yesterday's edition?",
                a: "Yes. Past editions are available in the archive. You can review the questions and answers, but replaying a completed edition does not award a second score.",
              },
              {
                q: "Where is my data stored?",
                a: "Your game progress, stats, and settings are stored in your browser's local storage. No data is sent to a server in this version.",
              },
              {
                q: "How do I reset my data?",
                a: "Use the reset option below. This will permanently delete all your local game history and statistics.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p
                  className="font-serif font-bold mb-1"
                  style={{ color: "var(--color-ink)" }}
                >
                  {q}
                </p>
                <p className="text-sm" style={{ color: "var(--color-dust)" }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="mb-10">
          <h2
            className="font-serif text-2xl font-bold mb-4"
            style={{ color: "var(--color-ink)" }}
          >
            Privacy
          </h2>
          <p className="text-sm mb-3" style={{ color: "var(--color-dust)" }}>
            This is a local-first application. All game data, stats, and
            settings are stored in your browser's local storage. Nothing is
            transmitted to a server.
          </p>
          <p className="text-sm" style={{ color: "var(--color-dust)" }}>
            When real authentication and cloud sync are introduced, this policy
            will be updated. Personal data collection will be minimised.
          </p>
        </section>

        {/* About */}
        <section id="about" className="mb-10">
          <h2
            className="font-serif text-2xl font-bold mb-4"
            style={{ color: "var(--color-ink)" }}
          >
            About SIDE B
          </h2>
          <p className="text-sm mb-3" style={{ color: "var(--color-dust)" }}>
            SIDE B is an independent Indian culture brand built around things
            people overlook — forgotten hits, cult films, regional culture,
            Indian internet lore, niche music, and unexpected connections.
          </p>
          <p className="text-sm" style={{ color: "var(--color-dust)" }}>
            The Daily Cut is the daily rarity trivia game. SIDE B Notes is the
            editorial section. SIDE B Goods is the merchandise arm. All three
            are part of the same project.
          </p>
        </section>

        {/* Interactive client section */}
        <SettingsClient />
      </div>
    </div>
  );
}
