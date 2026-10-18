import { INDIA_TIMEZONE } from "./config";

/**
 * Returns today's edition ID as "YYYY-MM-DD" in the Asia/Kolkata timezone.
 * This prevents the edition from rolling over at midnight UTC.
 */
export function getTodayEditionId(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA format is YYYY-MM-DD
  return formatter.format(now);
}

/**
 * Formats a date string for display.
 * e.g. "2026-10-18" → "18 OCT · EDITION 004"
 */
export function formatEditionLabel(dateStr: string, editionNumber?: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const dayStr = String(day).padStart(2, "0");
  const monthStr = d.toLocaleString("en-IN", { month: "short" }).toUpperCase();
  const edStr = editionNumber ? ` · EDITION ${String(editionNumber).padStart(3, "0")}` : "";
  return `${dayStr} ${monthStr}${edStr}`;
}

/**
 * Returns a formatted date like "Sunday, 18 October 2026"
 */
export function formatFullDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Checks whether two edition IDs (YYYY-MM-DD) are consecutive calendar days.
 */
export function areConsecutiveDays(earlier: string, later: string): boolean {
  const a = new Date(earlier);
  const b = new Date(later);
  const diffMs = b.getTime() - a.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}
