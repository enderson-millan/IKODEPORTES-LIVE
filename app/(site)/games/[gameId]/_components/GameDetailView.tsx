"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Diamond,
  Gauge,
  MapPin,
  MessageSquare,
  Swords,
  Table2,
  Users,
} from "lucide-react";
import type {
  CanonicalBaseballState,
  GameSummary,
  PitchResult,
} from "@shared/types/baseball-state";
import type { LiveConnection } from "@/hooks/use-live-game";
import { useApp } from "@/lib/app-context";
import {
  STATUS_LABEL_KEY,
  formatAverage,
  formatEra,
  formatLeagueDateTime,
  formatPitchSpeed,
} from "@/lib/game-format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/game/TeamBadge";
import { BasesDiamond } from "@/components/game/BasesDiamond";
import { CountGrid } from "@/components/game/CountGrid";
import { LineScoreTable } from "@/components/game/LineScoreTable";
import { PlayByPlayFeed } from "@/components/game/PlayByPlayFeed";
import { FieldView } from "@/components/game/FieldView";
import { GameTicker } from "@/components/game/GameTicker";

const PITCH_RESULT_KEY: Record<PitchResult, string> = {
  BALL: "BOLA",
  CALLED_STRIKE: "STRIKE",
  SWINGING_STRIKE: "SWING",
  FOUL: "FOUL",
  IN_PLAY: "EN JUEGO",
  HIT_BY_PITCH: "HBP",
  OTHER: "—",
};

const PITCH_RESULT_CLASS: Record<PitchResult, string> = {
  BALL: "bg-brand-blue/20 text-brand-blue-ink",
  CALLED_STRIKE: "bg-brand-gold/20 text-brand-gold-ink",
  SWINGING_STRIKE: "bg-brand-gold/20 text-brand-gold-ink",
  FOUL: "bg-white/10 text-foreground",
  IN_PLAY: "bg-emerald-500/20 text-emerald-300",
  HIT_BY_PITCH: "bg-live/20 text-live-ink",
  OTHER: "bg-white/10 text-muted-foreground",
};

function Panel({
  title,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn("flex flex-col rounded-xl border border-white/10 bg-surface-2/70", className)}
    >
      <header className="flex shrink-0 items-center gap-1.5 border-b border-white/5 px-2.5 py-1.5">
        {icon}
        <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        {actions && <div className="ml-auto">{actions}</div>}
      </header>
      <div className={cn("px-2.5 py-2", bodyClassName)}>{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded bg-black/25 px-1 py-0.5 text-center">
      <p className="text-[8px] font-bold uppercase tracking-widest text-white/50">{label}</p>
      <p className="font-display text-[13px] font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function CountChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span
      className={cn(
        "rounded px-1 py-0.5 font-display text-[10px] font-black tabular-nums tracking-wide",
        className,
      )}
    >
      {label} {value}
    </span>
  );
}

/**
 * "hace N s" desde la ultima vez que normalizamos un estado. No renderiza nada
 * hasta montar, para que el server y el primer render del cliente coincidan, y
 * luego late cada segundo: un feed silencioso se ve como silencio, no como una
 * pagina rota.
 */
/**
 * The upstream publishes every ~25-33 s measured, so three missed cycles is a
 * stall and not a quiet inning. Surfacing it matters on air: an operator must
 * know the overlay is showing old data.
 */
const STALE_AFTER_SECONDS = 90;

function Freshness({ timestamp, live }: { timestamp?: string; live?: boolean }) {
  const { t } = useApp();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Before mount both sides must render the same thing.
  if (!timestamp || now === null) {
    return (
      <span className="flex items-center gap-1">
        <Clock3 className="h-3 w-3" />
        {t("lastUpdated")}: —
      </span>
    );
  }

  const seconds = Math.max(0, Math.round((now - Date.parse(timestamp)) / 1000));
  const label =
    seconds < 60 ? `${t("ago")} ${seconds} s` : `${t("ago")} ${Math.floor(seconds / 60)} min`;
  const stale = Boolean(live) && seconds >= STALE_AFTER_SECONDS;

  return (
    <span className="flex items-center gap-1">
      <Clock3 className="h-3 w-3" />
      {t("lastUpdated")}:<span className="tabular-nums">{label}</span>
      {stale && (
        <span
          title={t("staleFeedHint")}
          className="ml-1 rounded border border-destructive/40 bg-destructive/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-destructive"
        >
          {t("staleFeed")}
        </span>
      )}
    </span>
  );
}

/**
 * Single-screen data center. Above the `desk` threshold the whole game fits the
 * viewport and only the defense list and the play-by-play scroll inside their
 * panels; below it panels keep natural heights and the page scrolls.
 */
export function GameDetailView({
  state,
  slate = [],
  connection = "live",
}: {
  state: CanonicalBaseballState;
  slate?: GameSummary[];
  connection?: LiveConnection;
}) {
  const { t } = useApp();
  const { matchup, score, clock, count, bases, atBat, onDeck, defense } = state;
  const halfLabel = clock.half === "TOP" ? t("topHalf") : t("bottomHalf");
  const statusLabel = t(STATUS_LABEL_KEY[state.status]);
  const live = state.status === "LIVE";

  // League time (not UTC, not the viewer's clock): deterministic on both sides.
  const stamp = (value?: string) => {
    const formatted = formatLeagueDateTime(value);
    return formatted ? `${formatted} ${t("timezoneAbbr")}` : "—";
  };

  const baseRows = [
    { label: "1B", occupied: bases.first, runner: bases.firstRunner },
    { label: "2B", occupied: bases.second, runner: bases.secondRunner },
    { label: "3B", occupied: bases.third, runner: bases.thirdRunner },
  ].filter((row) => row.occupied);

  const lastPitch = atBat
    ? [...atBat.pitches].sort((left, right) => right.sequence - left.sequence)[0]
    : undefined;

  return (
    <div className="bg-stadium flex min-h-0 flex-col desk:h-full">
      <div className="mx-auto flex w-full max-w-[1900px] flex-1 flex-col gap-2 px-2.5 py-2.5 desk:min-h-0 desk:overflow-hidden">
        <GameTicker games={slate} activeGameId={state.gameId} />

        {/* ── Scoreboard ──────────────────────────────────────────────── */}
        <header className="shrink-0 overflow-hidden rounded-xl border border-white/10 bg-surface-2/85">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/5 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link
              href="/games"
              className="inline-flex items-center gap-1 font-medium normal-case tracking-normal transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("backToGames")}
            </Link>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-bold",
                live ? "bg-live/20 text-live-ink" : "bg-white/10 text-muted-foreground",
              )}
            >
              {statusLabel}
            </span>
            <span className="text-[9px]">
              {state.league}
              {state.season ? ` · ${state.season}` : ""}
            </span>
            <span className="ml-auto flex flex-wrap items-center gap-3 text-[9px]">
              {state.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {state.venue.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {stamp(state.scheduledStart)}
              </span>
              <span className="flex items-center gap-1">
                <Freshness timestamp={state.source.fetchedAt} live={live} />
              </span>
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    connection === "live"
                      ? "bg-live"
                      : connection === "offline"
                        ? "bg-destructive"
                        : "animate-pulse bg-brand-gold",
                  )}
                />
                {connection === "offline"
                  ? t("noConnection")
                  : connection === "connecting"
                    ? t("reconnecting")
                    : t("navLive")}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 items-center gap-2 px-3 py-2 sm:grid-cols-[1fr_auto_1fr]">
            <div className="flex min-w-0 items-center gap-2">
              <TeamBadge team={matchup.away} size={52} />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-black uppercase leading-none tracking-wide">
                  {matchup.away.name}
                </p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {matchup.away.code}
                </p>
              </div>
              <p className="ml-auto font-display text-4xl font-black leading-none tabular-nums text-brand-gold-ink">
                {score.away}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("inning")} {clock.inning} · {halfLabel}
              </p>
              <div className="flex items-center gap-1">
                <CountChip
                  label="B"
                  value={count.balls}
                  className="bg-brand-blue/20 text-brand-blue-ink"
                />
                <CountChip
                  label="S"
                  value={count.strikes}
                  className="bg-brand-gold/20 text-brand-gold-ink"
                />
                <CountChip label="O" value={count.outs} className="bg-live/20 text-live-ink" />
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <p className="mr-auto font-display text-4xl font-black leading-none tabular-nums text-brand-gold-ink">
                {score.home}
              </p>
              <div className="min-w-0 text-right">
                <p className="truncate font-display text-base font-black uppercase leading-none tracking-wide">
                  {matchup.home.name}
                </p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {matchup.home.code}
                </p>
              </div>
              <TeamBadge team={matchup.home} size={52} />
            </div>
          </div>
        </header>

        {/* ── Dashboard ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,258px)_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px] desk:min-h-0 desk:flex-1">
          {/* Left: count, bases, on-deck, defense */}
          <aside className="flex min-h-0 flex-col gap-2">
            <Panel title={t("count")} icon={<Activity className="h-3 w-3 text-brand-blue-ink" />}>
              <CountGrid count={count} />
            </Panel>

            <Panel title={t("bases")} icon={<Diamond className="h-3 w-3 text-brand-gold-ink" />}>
              <div className="flex items-center gap-2">
                <BasesDiamond bases={bases} className="h-20 w-20 shrink-0" />
                {baseRows.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">{t("basesEmpty")}</p>
                ) : (
                  <ul className="min-w-0 space-y-1">
                    {baseRows.map((row) => (
                      <li key={row.label} className="flex items-center gap-1.5 text-[11px]">
                        <span className="rounded bg-brand-gold/20 px-1 font-display text-[9px] font-black text-brand-gold-ink">
                          {row.label}
                        </span>
                        <span className="truncate">{row.runner?.name ?? "—"}</span>
                        {row.runner?.jerseyNumber && (
                          <span className="ml-auto tabular-nums text-muted-foreground">
                            #{row.runner.jerseyNumber}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>

            <Panel title={t("onDeck")}>
              {onDeck.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-1">
                  {onDeck.map((batter) => (
                    <li
                      key={`${batter.order}-${batter.name}`}
                      className="flex items-center gap-1.5 text-[11px]"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-[9px] font-black">
                        {batter.order}
                      </span>
                      <span className="truncate">{batter.name}</span>
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        {formatAverage(batter.average)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title={t("defense")}
              icon={<Users className="h-3 w-3 text-brand-gold-ink" />}
              actions={
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  {defense.length}
                </span>
              }
              className="desk:min-h-0 desk:flex-1"
              bodyClassName="min-h-0 flex-1 overflow-y-auto"
            >
              <ul className="space-y-0.5 pr-1">
                {defense.map((slot) => (
                  <li
                    key={`${slot.position}-${slot.playerName}`}
                    className="flex items-center gap-2 rounded px-1 py-0.5 text-[11px] odd:bg-white/5"
                  >
                    <span className="w-7 shrink-0 rounded bg-brand-gold/15 text-center font-display text-[9px] font-black uppercase text-brand-gold-ink">
                      {slot.position}
                    </span>
                    <span className="truncate">{slot.playerName}</span>
                    {slot.jerseyNumber && (
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        #{slot.jerseyNumber}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>

          {/* Center: duel, field, pitches */}
          <section className="flex min-h-0 flex-col gap-2">
            <Panel
              title={t("atBat")}
              icon={<Swords className="h-3 w-3 text-live-ink" />}
              actions={
                lastPitch && (
                  <span className="font-display text-[9px] font-black uppercase tracking-widest text-brand-gold-ink">
                    {formatPitchSpeed(lastPitch)} · {PITCH_RESULT_KEY[lastPitch.result]}
                  </span>
                )
              }
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-brand-blue/30 bg-brand-blue-strong/20 px-2 py-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-brand-blue-ink">
                      {t("batter")}
                    </p>
                    {atBat?.batter.bats && (
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                        {atBat.batter.bats}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-display text-lg font-black uppercase leading-tight">
                    {atBat?.batter.name ?? "—"}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <MiniStat label={t("average")} value={formatAverage(atBat?.batter.average)} />
                    <MiniStat label={t("homeRuns")} value={atBat?.batter.homeRuns ?? "—"} />
                    <MiniStat label={t("rbi")} value={atBat?.batter.rbi ?? "—"} />
                  </div>
                  {atBat?.batter.todayLine && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {atBat.batter.todayLine}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-brand-gold/25 bg-brand-gold/10 px-2 py-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-brand-gold-ink">
                      {t("pitcher")}
                    </p>
                    {atBat?.pitcher.throws && (
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                        {atBat.pitcher.throws}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-display text-lg font-black uppercase leading-tight">
                    {atBat?.pitcher.name ?? "—"}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <MiniStat label={t("era")} value={formatEra(atBat?.pitcher.era)} />
                    <MiniStat label="REC" value={atBat?.pitcher.record ?? "—"} />
                    <MiniStat label="P" value={atBat?.pitcher.pitchCount ?? "—"} />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title={t("field")}
              icon={<Gauge className="h-3 w-3 text-emerald-400" />}
              className="desk:min-h-0 desk:flex-1"
              bodyClassName="min-h-0 flex-1"
            >
              <div className="h-full min-h-[240px] desk:min-h-0">
                <FieldView state={state} />
              </div>
            </Panel>

            <Panel
              title={t("pitchesOfAtBat")}
              actions={
                atBat && (
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    {atBat.pitches.length}
                  </span>
                )
              }
            >
              {atBat && atBat.pitches.length > 0 ? (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[...atBat.pitches]
                    .sort((left, right) => left.sequence - right.sequence)
                    .map((pitch) => (
                      <div
                        key={pitch.sequence}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1"
                      >
                        <span className="font-display text-[9px] font-black tabular-nums text-muted-foreground">
                          {pitch.sequence}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1 py-0.5 text-[9px] font-black uppercase tracking-wider",
                            PITCH_RESULT_CLASS[pitch.result],
                          )}
                        >
                          {PITCH_RESULT_KEY[pitch.result]}
                        </span>
                        <span className="text-[11px]">{pitch.type}</span>
                        <span className="font-display text-[11px] font-bold tabular-nums text-brand-gold-ink">
                          {formatPitchSpeed(pitch)}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">—</p>
              )}
            </Panel>
          </section>

          {/* Right: line score and play-by-play */}
          <aside className="flex min-h-0 flex-col gap-2 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start xl:col-span-1 xl:flex xl:flex-col xl:items-stretch desk:min-h-0">
            <Panel title={t("lineScore")} icon={<Table2 className="h-3 w-3 text-brand-gold-ink" />}>
              <LineScoreTable state={state} compact />
            </Panel>

            <Panel
              title={t("playByPlay")}
              icon={<MessageSquare className="h-3 w-3 text-live-ink" />}
              actions={
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  {state.playByPlay.length}
                </span>
              }
              className="desk:min-h-0 desk:flex-1"
              bodyClassName="min-h-0 flex-1 overflow-y-auto"
            >
              <PlayByPlayFeed
                items={state.playByPlay}
                awayCode={matchup.away.code}
                homeCode={matchup.home.code}
              />
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}
