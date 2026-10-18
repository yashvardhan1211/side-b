"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Archive, BookOpen, ShoppingBag, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",        label: "Home",    Icon: Home         },
  { href: "/archive", label: "Archive", Icon: Archive       },
  { href: "/notes",   label: "Notes",   Icon: BookOpen      },
  { href: "/goods",   label: "Goods",   Icon: ShoppingBag   },
  { href: "/profile", label: "Profile", Icon: User          },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav during active gameplay to keep focus
  if (pathname.startsWith("/play")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Main navigation"
      style={{ backgroundColor: "var(--color-ink)" }}
    >
      {/* Top rule */}
      <div className="h-px" style={{ backgroundColor: "var(--color-dust)" }} />
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 min-w-0 flex-1 py-2 px-1 transition-opacity"
              style={{
                color: isActive ? "var(--color-paper)" : "var(--color-dust)",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className="flex-shrink-0"
              />
              <span
                className="text-2xs font-mono tracking-widest uppercase truncate"
                style={{ fontSize: "0.55rem", letterSpacing: "0.1em" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
