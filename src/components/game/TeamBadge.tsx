"use client";

import Image from "next/image";
import { useState } from "react";
import type { TeamIdentity } from "@shared/types/baseball-state";
import { contrastText } from "@/lib/game-format";
import { teamLogo } from "@/lib/team-logo";
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  team: TeamIdentity;
  size?: number;
  className?: string;
}

/**
 * Club crest when one is available — a feed-provided `logoUrl` or the local
 * `public/teams` map — falling back to the 3-letter mark when the asset is
 * missing, so a bad path never leaves a hole in a panel.
 */
export function TeamBadge({ team, size = 40, className }: TeamBadgeProps) {
  const [failed, setFailed] = useState(false);
  const src = team.logoUrl ?? teamLogo(team.code);
  const showLogo = Boolean(src) && !failed;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-black tabular-nums",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: showLogo
          ? "transparent"
          : (team.primaryColor ?? "var(--brand-blue-strong)"),
        color: contrastText(team.primaryColor),
        fontSize: Math.round(size * 0.3),
      }}
    >
      {showLogo && src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain"
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        team.code
      )}
    </span>
  );
}
