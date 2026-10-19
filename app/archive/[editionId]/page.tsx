import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SAMPLE_EDITIONS, getEditionById, getEditionNumber } from "@/data/editions";
import { formatEditionLabel } from "@/lib/date";
import ArchiveReview from "./ArchiveReview";

interface Props {
  params: { editionId: string };
}

export async function generateStaticParams() {
  return SAMPLE_EDITIONS.map((e) => ({ editionId: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const edition = getEditionById(params.editionId);
  if (!edition) return { title: "Edition not found" };
  return {
    title: `Edition ${getEditionNumber(edition.id)} — ${edition.title}`,
  };
}

export default function ArchiveEditionPage({ params }: Props) {
  const edition = getEditionById(params.editionId);
  if (!edition) notFound();

  const number = getEditionNumber(edition.id);
  const label = formatEditionLabel(edition.date, number);

  return (
    <div className="flex-1">
      <div className="max-w-content mx-auto px-5 md:px-8 py-10">
        {/* Back */}
        <Link
          href="/archive"
          className="inline-flex items-center gap-1.5 label-caps mb-8 hover:opacity-60 transition-opacity"
          style={{ color: "var(--color-dust)" }}
        >
          <ArrowLeft size={12} />
          Archive
        </Link>

        <div className="rule-heavy mb-6" />

        <p className="label-caps mb-2">{label}</p>
        <h1
          className="font-serif text-3xl md:text-4xl font-black mb-2"
          style={{ color: "var(--color-ink)" }}
        >
          {edition.title}
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-dust)" }}>
          {edition.description}
        </p>

        {/* Archive review (client — checks completion status) */}
        <ArchiveReview edition={edition} editionNumber={number} />
      </div>
    </div>
  );
}
