"use client";

import Link from "next/link";
import type { GameSummary } from "@shared/types/baseball-state";
import { useApp } from "@/lib/app-context";
import { STATUS_LABEL_KEY, formatLeagueTime } from "@/lib/game-format";
import { cn } from "@/lib/utils";

interface GameTickerProps {
  games: GameSummary[];
  activeGameId: string;
}

/**
 * Today's slate strip. Renders nothing when the API could not be reached, so a
 * tracker page never breaks because discovery is down. Kickoff times use league
 * time, which keeps server and client output identical.
 */
export function GameTicker({ games, activeGameId }: GameTickerProps) {
  const { t } = useApp();

  if (games.length === 0) return null;

  return (
    <nav
      aria-label={t("ticker")}
      className="rounded-xl border border-white/10 bg-surface-1/90 px-2 py-1.5"
    >
      <ul className="flex items-center gap-1.5 overflow-x-auto">
        <li className="hidden shrink-0 items-center gap-1 pr-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground lg:flex">
          {t("ticker")}
        </li>
        {games.map((game) => {
          const active = game.gameId === activeGameId;
          const live = game.status === "LIVE";
          const statusText = live
            ? `${t(STATUS_LABEL_KEY[game.status])}${game.inning ? ` ${game.inning}` : ""}`
            : game.status === "SCHEDULED"
              ? (formatLeagueTime(game.scheduledStart) ?? t(STATUS_LABEL_KEY[game.status]))
              : t(STATUS_LABEL_KEY[game.status]);
          return (
            <li key={game.gameId} className="shrink-0">
              <Link
                href={`/games/${game.gameId}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-colors",
                  active
                    ? "border-brand-gold/60 bg-brand-gold/10"
                    : "border-white/10 bg-white/5 hover:border-white/25",
                )}
              >
                <span className="font-display font-black uppercase tracking-wide">
                  {game.away.code}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {game.awayScore}-{game.homeScore}
                </span>
                <span className="font-display font-black uppercase tracking-wide">
                  {game.home.code}
                </span>
                <span
                  className={cn(
                    "ml-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest",
                    live ? "bg-live/20 text-live-ink" : "bg-white/10 text-muted-foreground",
                  )}
                >
                  {statusText}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
