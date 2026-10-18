import type { Metadata } from "next";
import "./globals.css";
import DesktopNav from "@/components/layout/DesktopNav";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "SIDE B — India, beyond the obvious.",
    template: "%s | SIDE B",
  },
  description:
    "The daily rarity trivia game about Indian culture — music, cinema, internet history, food, and everything the mainstream overlooks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "var(--color-paper)" }}
      >
        <DesktopNav />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
