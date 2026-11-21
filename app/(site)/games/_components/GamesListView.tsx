"use client";

import Link from "next/link";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ArrowRight, CalendarClock, MapPin, Radio } from "lucide-react";
import type { CanonicalBaseballState } from "@shared/types/baseball-state";
import { useApp } from "@/lib/app-context";
import { STATUS_LABEL_KEY } from "@/lib/game-format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/game/TeamBadge";

dayjs.extend(utc);

function formatStart(value?: string): string {
  return value ? `${dayjs.utc(value).format("DD MMM YYYY · HH:mm")} UTC` : "—";
}

export function GamesListView({ games }: { games: CanonicalBaseballState[] }) {
  const { t } = useApp();

  return (
    <div className="bg-stadium min-h-[calc(100vh-4rem)] pb-14">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">
            <Radio className="h-3 w-3" />
            {t("navLive")}
          </span>
          <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
            {t("gamesTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("gamesSubtitle")}</p>
        </header>

        {games.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-white/15 py-16 text-center text-sm text-muted-foreground">
            {t("noGames")}
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => {
              const live = game.status === "LIVE";
              return (
                <Link
                  key={game.gameId}
                  href={`/games/${game.gameId}`}
                  className="group flex flex-col rounded-xl border border-white/10 bg-surface-2/70 p-4 transition-colors hover:border-brand-gold/40"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em]">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5",
                        live ? "bg-live/20 text-live" : "bg-white/10 text-muted-foreground",
                      )}
                    >
                      {t(STATUS_LABEL_KEY[game.status])}
                    </span>
                    <span className="text-muted-foreground">
                      {game.league} · {t("demoBadge")}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {[game.matchup.away, game.matchup.home].map((team, index) => (
                      <div key={team.id} className="flex items-center gap-2.5">
                        <TeamBadge team={team} size={30} />
                        <span className="min-w-0 flex-1 truncate font-display text-sm font-bold uppercase">
                          {team.name}
                        </span>
                        <span className="font-display text-xl font-black tabular-nums text-brand-gold">
                          {index === 0 ? game.score.away : game.score.home}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {formatStart(game.scheduledStart)}
                    </span>
                    {game.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {game.venue.name}
                      </span>
                    )}
                  </div>

                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold">
                    {t("openGame")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
