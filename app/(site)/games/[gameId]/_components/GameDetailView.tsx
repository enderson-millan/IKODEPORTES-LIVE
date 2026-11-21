"use client";

import Link from "next/link";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ArrowLeft, Clock3, MapPin } from "lucide-react";
import type {
  CanonicalBaseballState,
  PitchDetail,
  PitchResult,
} from "@shared/types/baseball-state";
import { useApp } from "@/lib/app-context";
import { STATUS_LABEL_KEY, formatAverage, formatEra, formatPitchSpeed } from "@/lib/game-format";
import { cn } from "@/lib/utils";
import { TeamBadge } from "@/components/game/TeamBadge";
import { BasesDiamond } from "@/components/game/BasesDiamond";
import { CountGrid } from "@/components/game/CountGrid";
import { LineScoreTable } from "@/components/game/LineScoreTable";
import { PlayByPlayFeed } from "@/components/game/PlayByPlayFeed";
import { FieldView } from "@/components/game/FieldView";

dayjs.extend(utc);

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
  BALL: "bg-brand-blue/20 text-brand-blue",
  CALLED_STRIKE: "bg-brand-gold/20 text-brand-gold",
  SWINGING_STRIKE: "bg-brand-gold/20 text-brand-gold",
  FOUL: "bg-white/10 text-foreground",
  IN_PLAY: "bg-emerald-500/20 text-emerald-300",
  HIT_BY_PITCH: "bg-live/20 text-live",
  OTHER: "bg-white/10 text-muted-foreground",
};

function formatTimestamp(value?: string): string {
  if (!value) return "—";
  return `${dayjs.utc(value).format("DD MMM YYYY · HH:mm")} UTC`;
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-white/10 bg-surface-2/70 p-4", className)}>
      <h2 className="mb-3 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1.5 text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function PitchRow({ pitch }: { pitch: PitchDetail }) {
  return (
    <li className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
      <span className="w-4 text-center font-display text-[11px] font-bold tabular-nums text-muted-foreground">
        {pitch.sequence}
      </span>
      <span
        className={cn(
          "min-w-[64px] rounded px-1.5 py-0.5 text-center font-display text-[9px] font-black uppercase tracking-wider",
          PITCH_RESULT_CLASS[pitch.result],
        )}
      >
        {PITCH_RESULT_KEY[pitch.result]}
      </span>
      <span className="flex-1 truncate text-xs">{pitch.type}</span>
      <span className="font-display text-xs font-bold tabular-nums text-brand-gold">
        {formatPitchSpeed(pitch)}
      </span>
    </li>
  );
}

export function GameDetailView({ state }: { state: CanonicalBaseballState }) {
  const { t } = useApp();
  const { matchup, score, clock, count, bases, atBat, onDeck, defense } = state;
  const halfLabel = clock.half === "TOP" ? t("topHalf") : t("bottomHalf");

  return (
    <div className="bg-stadium min-h-[calc(100vh-4rem)] pb-12">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("backToGames")}
        </Link>

        {/* ── Scoreboard header ──────────────────────────────────────────── */}
        <header className="mt-3 rounded-2xl border border-white/10 bg-surface-2/80 p-4 shadow-xl sm:p-5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="flex items-center gap-1.5 text-live">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
              </span>
              {t(STATUS_LABEL_KEY[state.status])}
            </span>
            <span>
              {t("inning")} {clock.inning} · {halfLabel}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex items-center gap-3">
              <TeamBadge team={matchup.away} size={48} />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold uppercase leading-tight sm:text-lg">
                  {matchup.away.name}
                </p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {state.league}
                  {state.season ? ` · ${state.season}` : ""}
                </p>
              </div>
            </div>

            <div className="font-display text-4xl font-black tabular-nums text-brand-gold sm:text-5xl">
              {score.away}
              <span className="mx-2 text-muted-foreground">–</span>
              {score.home}
            </div>

            <div className="flex items-center justify-end gap-3 text-right">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold uppercase leading-tight sm:text-lg">
                  {matchup.home.name}
                </p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {matchup.home.shortName ?? matchup.home.code}
                </p>
              </div>
              <TeamBadge team={matchup.home} size={48} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-muted-foreground">
            {state.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {state.venue.name}
                {state.venue.city ? ` · ${state.venue.city}` : ""}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTimestamp(state.scheduledStart)}
            </span>
            <span>
              {t("lastUpdated")}: {formatTimestamp(state.updatedAt)}
            </span>
          </div>
        </header>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Panel title={t("atBat")}>
              {atBat ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-brand-blue-strong/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                      {t("batter")}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold uppercase leading-tight">
                      {atBat.batter.name}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <Stat label={t("average")} value={formatAverage(atBat.batter.average)} />
                      <Stat label={t("homeRuns")} value={atBat.batter.homeRuns ?? "—"} />
                      <Stat label={t("rbi")} value={atBat.batter.rbi ?? "—"} />
                    </div>
                    {atBat.batter.todayLine && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {atBat.batter.todayLine}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-brand-gold/10 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                      {t("pitcher")}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold uppercase leading-tight">
                      {atBat.pitcher.name}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <Stat label={t("era")} value={formatEra(atBat.pitcher.era)} />
                      <Stat label="REC" value={atBat.pitcher.record ?? "—"} />
                      <Stat label="P" value={atBat.pitcher.pitchCount ?? "—"} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </Panel>

            <Panel title={t("field")}>
              <div className="aspect-[25/16] w-full">
                <FieldView state={state} />
              </div>
            </Panel>

            <Panel title={t("pitchesOfAtBat")}>
              {atBat && atBat.pitches.length > 0 ? (
                <ul className="space-y-1.5">
                  {[...atBat.pitches]
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((pitch) => (
                      <PitchRow key={pitch.sequence} pitch={pitch} />
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </Panel>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <Panel title={t("count")}>
                <CountGrid count={count} />
              </Panel>
              <Panel title={t("bases")} className="flex flex-col items-center justify-between">
                <BasesDiamond bases={bases} />
                <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {bases.first || bases.second || bases.third ? "· · ·" : t("basesEmpty")}
                </p>
              </Panel>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel title={t("onDeck")}>
                <ul className="space-y-2">
                  {onDeck.map((batter) => (
                    <li key={`${batter.order}-${batter.name}`} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-[10px] font-black">
                        #{batter.order}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{batter.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {batter.note ?? `${t("average")} ${formatAverage(batter.average)}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title={t("defense")}>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {defense.map((slot) => (
                    <li
                      key={`${slot.position}-${slot.playerName}`}
                      className="flex items-baseline gap-1.5 text-xs"
                    >
                      <span className="w-7 shrink-0 font-display text-[10px] font-black uppercase text-brand-gold">
                        {slot.position}
                      </span>
                      <span className="truncate">{slot.playerName}</span>
                      {slot.jerseyNumber && (
                        <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                          #{slot.jerseyNumber}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>

          <aside className="space-y-4">
            <Panel title={t("lineScore")}>
              <LineScoreTable state={state} />
            </Panel>

            <Panel title={t("playByPlay")}>
              <PlayByPlayFeed
                items={state.playByPlay}
                awayCode={matchup.away.code}
                homeCode={matchup.home.code}
              />
            </Panel>
          </aside>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">{t("trackerNote")}</p>
      </div>
    </div>
  );
}
