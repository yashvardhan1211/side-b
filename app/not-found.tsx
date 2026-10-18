import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-sm mx-auto px-5 text-center py-20">
        <p
          className="font-mono text-7xl font-bold mb-4"
          style={{ color: "var(--color-dust-border)" }}
        >
          404
        </p>
        <h1
          className="font-serif text-2xl font-bold mb-3"
          style={{ color: "var(--color-ink)" }}
        >
          This track doesn't exist.
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-dust)" }}>
          Whatever you were looking for, it's not in the vault.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 font-mono text-xs tracking-widest uppercase transition-opacity hover:opacity-85"
          style={{
            backgroundColor: "var(--color-ink)",
            color: "var(--color-paper)",
            borderRadius: "2px",
          }}
        >
          Back to SIDE B
        </Link>
      </div>
    </div>
  );
}
