"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/archive", label: "Archive" },
  { href: "/notes",   label: "Notes"   },
  { href: "/goods",   label: "Goods"   },
  { href: "/profile", label: "Profile" },
  { href: "/settings",label: "Help"    },
];

export default function DesktopNav() {
  const pathname = usePathname();

  // Minimal focused header during gameplay
  if (pathname.startsWith("/play")) {
    return (
      <header
        className="hidden md:block border-b"
        style={{
          borderColor: "var(--color-dust-border)",
          backgroundColor: "var(--color-paper)",
        }}
      >
        <div className="max-w-wide mx-auto px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif font-bold text-xl tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            SIDE B
          </Link>
          <span className="label-caps">The Daily Cut</span>
        </div>
      </header>
    );
  }

  return (
    <header
      className="hidden md:block border-b sticky top-0 z-50"
      style={{
        borderColor: "var(--color-dust-border)",
        backgroundColor: "var(--color-paper)",
      }}
    >
      <div className="max-w-wide mx-auto px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif font-black text-xl tracking-tight flex items-baseline gap-1"
          style={{ color: "var(--color-ink)" }}
        >
          SIDE B
          <span
            className="font-mono text-2xs ml-1"
            style={{ color: "var(--color-dust)", fontSize: "0.5rem", letterSpacing: "0.2em" }}
          >
            ®
          </span>
        </Link>

        <nav className="flex items-center gap-8" aria-label="Desktop navigation">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="label-caps-ink transition-colors hover:opacity-60"
                style={{
                  color: isActive ? "var(--color-oxblood)" : "var(--color-ink)",
                  fontWeight: isActive ? "600" : "400",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/play"
          className="hidden lg:inline-flex items-center px-4 py-2 text-xs font-mono tracking-widest uppercase transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--color-ink)",
            color: "var(--color-paper)",
            letterSpacing: "0.12em",
          }}
        >
          Play Today's Cut
        </Link>
      </div>
    </header>
  );
}
