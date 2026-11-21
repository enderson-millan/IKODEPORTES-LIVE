"use client";

import type { PlayByPlayItem } from "@shared/types/baseball-state";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

interface PlayByPlayFeedProps {
  items: PlayByPlayItem[];
  awayCode: string;
  homeCode: string;
}

export function PlayByPlayFeed({ items, awayCode, homeCode }: PlayByPlayFeedProps) {
  const { t } = useApp();
  const ordered = [...items].sort((a, b) => b.sequence - a.sequence);

  return (
    <div className="space-y-2">
      {ordered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">—</p>}

      {ordered.map((item) => (
        <article
          key={item.sequence}
          className={cn(
            "rounded-lg border-l-2 bg-white/5 p-3",
            item.kind === "HOME_RUN"
              ? "border-l-brand-gold"
              : item.kind === "HIT"
                ? "border-l-brand-blue"
                : "border-l-white/20",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-brand-blue-strong/25 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-white">
              {item.inning}° {item.half === "TOP" ? "▲" : "▼"}
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {awayCode} {item.awayScore ?? "–"} · {homeCode} {item.homeScore ?? "–"}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-snug">{item.description}</p>
          {item.batterName && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("batter")}: {item.batterName}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
