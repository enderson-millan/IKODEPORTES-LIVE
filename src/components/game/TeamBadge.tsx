import type { TeamIdentity } from "@shared/types/baseball-state";
import { contrastText } from "@/lib/game-format";
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  team: TeamIdentity;
  size?: number;
  className?: string;
}

/** Trademark-free 3-letter team mark. */
export function TeamBadge({ team, size = 40, className }: TeamBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-black tabular-nums",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: team.primaryColor ?? "var(--brand-blue-strong)",
        color: contrastText(team.primaryColor),
        fontSize: Math.round(size * 0.3),
      }}
    >
      {team.code}
    </span>
  );
}
