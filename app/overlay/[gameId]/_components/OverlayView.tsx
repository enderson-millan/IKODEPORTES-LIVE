"use client";

import { useEffect, useState } from "react";
import type { CanonicalBaseballState } from "@shared/types/baseball-state";
import { demoGame } from "@shared/fixtures/demo-game";
import { useLiveGame } from "@/hooks/use-live-game";
import { useApp } from "@/lib/app-context";
import { STATUS_LABEL_KEY, formatAverage, formatEra } from "@/lib/game-format";
import { cn } from "@/lib/utils";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { TeamBadge } from "@/components/game/TeamBadge";
import { FieldView } from "@/components/game/FieldView";

interface OverlayViewProps {
  gameId: string;
  wsUrl: string;
  /** Comma-separated panel ids; omitted = all, "none" = none. */
  panels?: string;
}

function useFitScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

function OverlayStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-black/25 px-1.5 py-1 text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/55">{label}</p>
      <p className="font-display text-[18px] font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function TeamBlock({
  team,
  score,
  align,
}: {
  team: CanonicalBaseballState["matchup"]["away"];
  score: number;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex items-center gap-3", align === "right" && "flex-row-reverse")}>
      <TeamBadge team={team} size={54} />
      <div className={cn("min-w-0", align === "right" && "text-right")}>
        <p className="truncate font-display text-[20px] font-black uppercase leading-none">
          {team.name}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {team.code}
        </p>
      </div>
      <p className="font-display text-[56px] font-black leading-none tabular-nums text-brand-gold">
        {score}
      </p>
    </div>
  );
}

function LineScoreRow({ state, side }: { state: CanonicalBaseballState; side: "away" | "home" }) {
  const line = state.lineScore[side];
  const team = state.matchup[side];

  return (
    <tr className="border-t border-white/10">
      <th scope="row" className="py-1.5 pr-4 text-left">
        <span className="font-display text-[15px] font-black uppercase text-brand-gold">
          {team.code}
        </span>
      </th>
      {line.innings.map((inning) => {
        const active =
          inning.inning === state.clock.inning &&
          (side === "home" ? state.clock.half === "BOTTOM" : state.clock.half === "TOP");
        return (
          <td
            key={inning.inning}
            className={cn(
              "px-1.5 py-1.5 text-center text-[15px] tabular-nums",
              active ? "bg-brand-gold/15 font-bold text-brand-gold" : "text-white/80",
            )}
          >
            {inning.runs ?? "–"}
          </td>
        );
      })}
      <td className="px-1.5 py-1.5 text-center text-[16px] font-bold tabular-nums text-brand-gold">
        {line.runs}
      </td>
      <td className="px-1.5 py-1.5 text-center text-[16px] tabular-nums text-white/70">
        {line.hits}
      </td>
      <td className="px-1.5 py-1.5 text-center text-[16px] tabular-nums text-white/70">
        {line.errors}
      </td>
    </tr>
  );
}

/** OBS browser source: transparent 1920x1080 canvas, no site chrome. */
export function OverlayView({ gameId, wsUrl, panels }: OverlayViewProps) {
  const { t } = useApp();
  const scale = useFitScale();
  const { state, connection } = useLiveGame(gameId, {
    wsUrl,
    fallback: gameId === "demo-live" ? demoGame : null,
  });

  const requested = panels?.trim();
  const visible =
    requested === undefined || requested === ""
      ? null
      : requested === "none"
        ? new Set<string>()
        : new Set(
            requested
              .split(",")
              .map((panel) => panel.trim())
              .filter(Boolean),
          );

  const show = (panel: string) => visible === null || visible.has(panel);

  const lastPlay = state?.playByPlay.at(-1);
  const lastPlays = state
    ? [...state.playByPlay].sort((a, b) => b.sequence - a.sequence).slice(0, 4)
    : [];
  const halfLabel = state?.clock.half === "BOTTOM" ? t("bottomHalf") : t("topHalf");
  const connectionLabel =
    connection === "live"
      ? t("statusLive")
      : connection === "connecting"
        ? t("connecting")
        : t("offline");

  return (
    <div className="overlay-canvas fixed inset-0 overflow-hidden">
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}
      >
        {!state ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface-1/95 px-8 py-6">
              <BrandLogo size={56} />
              <div>
                <BrandWordmark className="text-xl" />
                <p className="mt-1 text-[12px] uppercase tracking-[0.25em] text-brand-gold">
                  {t("connecting")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {show("scoreboard") ? (
              <header className="absolute left-8 right-8 top-6 flex h-[112px] items-center justify-between rounded-2xl border border-white/10 bg-surface-1/95 px-7 shadow-2xl">
                <div className="flex items-center gap-4">
                  <BrandLogo size={62} />
                  <div>
                    <BrandWordmark className="text-xl" />
                    <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-brand-gold">
                      {t("tagline")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <TeamBlock team={state.matchup.away} score={state.score.away} align="left" />

                  <div className="rounded-xl border border-white/10 bg-black/30 px-5 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("inning")} {state.clock.inning} · {halfLabel}
                    </p>
                    <p className="mt-1 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                      {state.league} · {state.source.adapter}
                    </p>
                  </div>

                  <TeamBlock team={state.matchup.home} score={state.score.home} align="right" />
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                      connection === "live"
                        ? "bg-live/20 text-live"
                        : connection === "connecting"
                          ? "bg-white/10 text-muted-foreground"
                          : "bg-destructive/20 text-destructive",
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {connectionLabel}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t(STATUS_LABEL_KEY[state.status])}
                  </span>
                </div>
              </header>
            ) : (
              <div className="h-[142px]" />
            )}

            <main
              className={cn(
                "absolute bottom-[104px] left-8 right-8 top-[142px] grid gap-5",
                show("field") ? "grid-cols-[1180px_1fr]" : "grid-cols-1",
              )}
            >
              {show("field") && (
                <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-surface-1/90 p-4">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        {t("field")}
                      </span>
                      <span className="rounded bg-brand-gold/15 px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                        {state.clock.inning}° {halfLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[
                        { label: "B", value: state.count.balls, tone: "text-brand-blue" },
                        { label: "S", value: state.count.strikes, tone: "text-brand-gold" },
                        { label: "O", value: state.count.outs, tone: "text-live" },
                      ].map((item) => (
                        <span
                          key={item.label}
                          className="rounded-md bg-black/35 px-2.5 py-1 font-display text-[12px] font-black uppercase tracking-widest"
                        >
                          {item.label}{" "}
                          <span className={cn("tabular-nums", item.tone)}>{item.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1">
                    <FieldView state={state} />
                  </div>
                </section>
              )}

              <aside className="flex min-h-0 flex-col gap-4">
                {show("duel") && (
                  <section className="rounded-2xl border border-white/10 bg-surface-1/90 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        {t("atBat")}
                      </p>
                      <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                        {t("count")} {state.count.balls}-{state.count.strikes}-{state.count.outs}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-brand-blue-strong/20 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                          {t("batter")}
                        </p>
                        <p className="mt-1 truncate font-display text-[20px] font-black uppercase leading-tight">
                          {state.atBat?.batter.name ?? "—"}
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                          <OverlayStat
                            label={t("average")}
                            value={formatAverage(state.atBat?.batter.average)}
                          />
                          <OverlayStat
                            label={t("homeRuns")}
                            value={state.atBat?.batter.homeRuns ?? "—"}
                          />
                          <OverlayStat label={t("rbi")} value={state.atBat?.batter.rbi ?? "—"} />
                        </div>
                      </div>
                      <div className="rounded-xl bg-brand-gold/10 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                          {t("pitcher")}
                        </p>
                        <p className="mt-1 truncate font-display text-[20px] font-black uppercase leading-tight">
                          {state.atBat?.pitcher.name ?? "—"}
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                          <OverlayStat
                            label={t("era")}
                            value={formatEra(state.atBat?.pitcher.era)}
                          />
                          <OverlayStat label="REC" value={state.atBat?.pitcher.record ?? "—"} />
                          <OverlayStat label="P" value={state.atBat?.pitcher.pitchCount ?? "—"} />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {show("lineScore") && (
                  <section className="rounded-2xl border border-white/10 bg-surface-1/90 p-4">
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      {t("lineScore")}
                    </p>
                    <table className="mt-2 w-full">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          <th className="pb-1.5" />
                          {state.lineScore.away.innings.map((inning) => (
                            <th
                              key={inning.inning}
                              className="px-1 pb-1.5 text-center font-semibold"
                            >
                              {inning.inning}
                            </th>
                          ))}
                          <th className="px-1 pb-1.5 text-center text-white">{t("runs")}</th>
                          <th className="px-1 pb-1.5 text-center text-white">{t("hits")}</th>
                          <th className="px-1 pb-1.5 text-center text-white">{t("errors")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <LineScoreRow state={state} side="away" />
                        <LineScoreRow state={state} side="home" />
                      </tbody>
                    </table>
                  </section>
                )}

                {show("plays") && (
                  <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-surface-1/90 p-4">
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      {t("playByPlay")}
                    </p>
                    <div className="mt-2 space-y-2 overflow-hidden">
                      {lastPlays.map((play) => (
                        <article key={play.sequence} className="rounded-lg bg-white/5 p-2.5">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <span className="rounded bg-brand-blue-strong/30 px-1.5 py-0.5 text-white">
                              {play.inning}° {play.half === "TOP" ? "▲" : "▼"}
                            </span>
                            <span>
                              {state.matchup.away.code} {play.awayScore ?? "–"} ·{" "}
                              {state.matchup.home.code} {play.homeScore ?? "–"}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-3 text-[14px] leading-snug text-white/90">
                            {play.description}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            </main>

            {show("ticker") && (
              <footer className="absolute bottom-6 left-8 right-8 flex h-[72px] items-center gap-4 rounded-2xl border border-white/10 bg-surface-1/95 px-5">
                <span className="rounded bg-brand-gold px-2 py-1 font-display text-[10px] font-black uppercase tracking-[0.18em] text-surface-1">
                  {t("lastPlay")}
                </span>
                <p className="min-w-0 flex-1 truncate text-[18px] text-white/90">
                  {lastPlay?.description ?? "—"}
                </p>
                {lastPlay && (
                  <span className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {lastPlay.inning}° {lastPlay.half === "TOP" ? "▲" : "▼"}
                  </span>
                )}
              </footer>
            )}
          </>
        )}
      </div>
    </div>
  );
}
