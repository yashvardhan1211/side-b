import { RARITY_CONFIG } from "@/lib/config";
import type { RarityTier } from "@/lib/types";

interface RarityBadgeProps {
  tier: RarityTier;
  size?: "sm" | "md" | "lg";
  showPoints?: boolean;
}

export default function RarityBadge({
  tier,
  size = "md",
  showPoints = false,
}: RarityBadgeProps) {
  const config = RARITY_CONFIG[tier];
  if (!config) return null;

  const sizeClasses = {
    sm: "text-2xs px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 font-mono tracking-widest uppercase ${sizeClasses[size]} ${config.bgClass}`}
      style={{ borderRadius: "2px" }}
    >
      <span
        className="inline-block rounded-full flex-shrink-0"
        style={{
          width: size === "lg" ? "8px" : "6px",
          height: size === "lg" ? "8px" : "6px",
          backgroundColor: config.dotColor,
        }}
        aria-hidden="true"
      />
      {config.label}
      {showPoints && (
        <span className="opacity-60">+{config.points}</span>
      )}
    </span>
  );
}
