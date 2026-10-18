import type { Metadata } from "next";
import Link from "next/link";
import { SAMPLE_NOTES, getFeaturedNote } from "@/data/notes";
import type { NoteCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "SIDE B Notes",
  description: "Stories, references and little things worth knowing.",
};

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  music:       "Music",
  cinema:      "Cinema",
  internet:    "Internet",
  television:  "Television",
  advertising: "Advertising",
  cricket:     "Cricket",
  literature:  "Literature",
  street:      "Street",
  regional:    "Regional",
};

export default function NotesPage() {
  const featured = getFeaturedNote();
  const rest = SAMPLE_NOTES.filter((n) => !n.featured);

  return (
    <div className="flex-1">
      <div className="max-w-wide mx-auto px-5 md:px-8 py-10">
        {/* Header */}
        <span className="label-caps block mb-2">SIDE B Notes</span>
        <div className="rule-heavy mb-6" />

        <h1
          className="font-serif text-4xl md:text-5xl font-black mb-3"
          style={{ color: "var(--color-ink)" }}
        >
          India, in the margins.
        </h1>
        <p
          className="text-sm mb-10 max-w-prose-sm"
          style={{ color: "var(--color-dust)" }}
        >
          Stories, references and little things worth knowing. Editorial
          content about Indian music, cinema, food, internet history, and
          overlooked cultural moments.
        </p>

        {/* Featured */}
        {featured && (
          <Link
            href={`/notes/${featured.slug}`}
            className="group block mb-12 border"
            style={{ borderColor: "var(--color-dust-border)" }}
          >
            <div className="grid md:grid-cols-5 gap-0">
              {/* Placeholder image */}
              <div
                className="md:col-span-2 aspect-video md:aspect-auto min-h-40 flex items-end p-6"
                style={{ backgroundColor: "var(--color-ink)" }}
              >
                <div>
                  <p className="label-caps mb-1" style={{ color: "var(--color-dust)" }}>
                    Field Journal 001
                  </p>
                  <p
                    className="font-serif italic text-sm"
                    style={{ color: "rgba(242,235,221,0.5)" }}
                  >
                    Featured
                  </p>
                </div>
              </div>

              <div className="md:col-span-3 p-6 flex flex-col justify-between">
                <div>
                  <p
                    className="label-caps mb-3"
                    style={{ color: "var(--color-oxblood)" }}
                  >
                    {CATEGORY_LABELS[featured.category]} · {featured.readingTime} min read
                  </p>
                  <h2
                    className="font-serif text-2xl md:text-3xl font-bold leading-snug mb-3 group-hover:opacity-70 transition-opacity"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {featured.title}
                  </h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-dust)" }}
                  >
                    {featured.subtitle}
                  </p>
                </div>
                <p
                  className="label-caps mt-6 underline underline-offset-2"
                  style={{ color: "var(--color-ink)" }}
                >
                  Read more →
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Category filter hint */}
        <div className="flex gap-3 flex-wrap mb-6">
          {(["music", "cinema", "television", "street", "cricket"] as NoteCategory[]).map((cat) => (
            <span
              key={cat}
              className="label-caps px-3 py-1"
              style={{
                border: "1px solid var(--color-dust-border)",
                color: "var(--color-dust)",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </span>
          ))}
        </div>

        {/* Story grid */}
        <div className="grid md:grid-cols-2 gap-px" style={{ backgroundColor: "var(--color-dust-border)" }}>
          {rest.map((note) => (
            <Link
              key={note.slug}
              href={`/notes/${note.slug}`}
              className="group p-6"
              style={{ backgroundColor: "var(--color-paper)" }}
            >
              <p
                className="label-caps mb-2"
                style={{ color: "var(--color-oxblood)" }}
              >
                {CATEGORY_LABELS[note.category]} · {note.readingTime} min
              </p>
              <h3
                className="font-serif text-xl font-bold leading-snug mb-2 group-hover:opacity-70 transition-opacity"
                style={{ color: "var(--color-ink)" }}
              >
                {note.title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "var(--color-dust)" }}
              >
                {note.subtitle}
              </p>
              <span
                className="label-caps underline underline-offset-2"
                style={{ color: "var(--color-dust)" }}
              >
                Read →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
