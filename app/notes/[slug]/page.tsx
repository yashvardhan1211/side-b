import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SAMPLE_NOTES, getNoteBySlug, getRelatedNotes } from "@/data/notes";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return SAMPLE_NOTES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const note = getNoteBySlug(params.slug);
  if (!note) return { title: "Story not found" };
  return {
    title: note.title,
    description: note.subtitle,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  music: "Music", cinema: "Cinema", internet: "Internet",
  television: "Television", advertising: "Advertising",
  cricket: "Cricket", literature: "Literature",
  street: "Street", regional: "Regional",
};

export default function NoteDetailPage({ params }: Props) {
  const note = getNoteBySlug(params.slug);
  if (!note) notFound();

  const related = getRelatedNotes(note.relatedSlugs ?? []);

  // Simple paragraph rendering (split on double newlines)
  const paragraphs = note.body.trim().split(/\n\n+/);

  return (
    <div className="flex-1">
      <div className="max-w-content mx-auto px-5 md:px-8 py-10">
        {/* Back */}
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 label-caps mb-8 hover:opacity-60 transition-opacity"
          style={{ color: "var(--color-dust)" }}
        >
          <ArrowLeft size={12} />
          Notes
        </Link>

        {/* Category + read time */}
        <p
          className="label-caps mb-3"
          style={{ color: "var(--color-oxblood)" }}
        >
          {CATEGORY_LABELS[note.category] ?? note.category} · {note.readingTime} min read
        </p>

        <div className="rule-heavy mb-6" />

        {/* Title */}
        <h1
          className="font-serif text-3xl md:text-4xl font-black leading-snug mb-3"
          style={{ color: "var(--color-ink)" }}
        >
          {note.title}
        </h1>
        <p
          className="font-serif italic text-lg mb-8"
          style={{ color: "var(--color-dust)" }}
        >
          {note.subtitle}
        </p>

        {/* Body */}
        <article className="space-y-5 mb-12">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="text-base leading-relaxed font-serif"
              style={{ color: "var(--color-ink)" }}
            >
              {para.trim()}
            </p>
          ))}
        </article>

        {/* Disclaimer */}
        <div
          className="border-l-2 pl-4 mb-10"
          style={{ borderColor: "var(--color-dust-border)" }}
        >
          <p className="label-caps mb-1">Note</p>
          <p className="text-xs" style={{ color: "var(--color-dust)" }}>
            This is sample editorial content for the SIDE B prototype. Author
            credentials, quotations, and specific factual claims should be
            researched and verified before any public publication.
          </p>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <div className="rule mb-6" />
            <p className="label-caps mb-4">Related stories</p>
            <div className="space-y-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/notes/${r.slug}`}
                  className="group flex items-center justify-between py-2 hover:opacity-70 transition-opacity"
                >
                  <div>
                    <p className="label-caps mb-0.5" style={{ color: "var(--color-oxblood)" }}>
                      {CATEGORY_LABELS[r.category]} · {r.readingTime} min
                    </p>
                    <p
                      className="font-serif font-bold"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {r.title}
                    </p>
                  </div>
                  <span className="label-caps ml-4 flex-shrink-0" style={{ color: "var(--color-dust)" }}>
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
