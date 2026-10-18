import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="mt-auto border-t pb-20 md:pb-8"
      style={{
        borderColor: "var(--color-dust-border)",
        backgroundColor: "var(--color-paper)",
      }}
    >
      <div className="max-w-wide mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-serif font-black text-lg" style={{ color: "var(--color-ink)" }}>
              SIDE B
            </p>
            <p className="label-caps mt-0.5">India, beyond the obvious.</p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigation">
            {[
              { href: "/settings", label: "Rules & Help" },
              { href: "/settings#privacy", label: "Privacy" },
              { href: "/settings#about", label: "About" },
              { href: "/archive", label: "Archive" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="label-caps hover:opacity-60 transition-opacity"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="rule mt-6 pt-4">
          <p className="label-caps" style={{ color: "var(--color-dust)" }}>
            © 2026 SIDE B — SAMPLE / ILLUSTRATIVE BUILD — NOT FOR DISTRIBUTION
          </p>
        </div>
      </div>
    </footer>
  );
}
