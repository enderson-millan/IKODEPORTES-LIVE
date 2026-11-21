/* eslint-disable prettier/prettier */
"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { Match, Pick, Team } from "@/lib/types";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

dayjs.extend(utc);

// ─── Live status badge ────────────────────────────────────────────────────────

function LiveBadge({ clock }: { clock?: string }) {
  const { t } = useApp();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-500">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      {clock ? clock : t("live")}
    </span>
  );
}

function FinishedBadge({ decision }: { decision?: string }) {
  const { t } = useApp();

  const suffix = decision === "PEN" ? " · PEN" : decision === "AET" ? " · AET" : "";

  return (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
      {t("finished")}
      {suffix && <span className="ml-0.5 text-amber-500">{suffix}</span>}
    </span>
  );
}

function UpcomingBadge({ kickoff }: { kickoff: string }) {
  const dateLabel = dayjs.utc(kickoff).local().format("DD/MM HH:mm");
  return <span className="text-[9px] tabular-nums text-muted-foreground">{dateLabel}</span>;
}

// ─── Team row ─────────────────────────────────────────────────────────────────

interface BracketTeamRowProps {
  team: Team;
  match: Match;
  isPicked: boolean;
  locked: boolean;
  pickedCorrect?: boolean;
  onPick: () => void;
}

function BracketTeamRow({
  team,
  match,
  isPicked,
  locked,
  pickedCorrect,
  onPick,
}: BracketTeamRowProps) {
  const showScore = match.status !== "UPCOMING";
  const isTbd = team.abbr === "TBD";

  return (
    <button
      type="button"
      disabled={locked || isTbd}
      onClick={onPick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors",
        // Picked + correct
        isPicked &&
          pickedCorrect !== false &&
          "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/40",
        // Picked + wrong
        isPicked && pickedCorrect === false && "bg-red-500/10 ring-1 ring-inset ring-red-400/40",
        // Not picked + unlocked
        !isPicked && !locked && !isTbd && "hover:bg-accent",
        // Locked — dim cursor
        (locked || isTbd) && "cursor-default",
      )}
    >
      {/* Flag + name */}
      <div className="flex min-w-0 items-center gap-1.5">
        {!isTbd && team.logo ? (
          <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
            <Image
              src={team.logo}
              alt={team.abbr}
              width={20}
              height={20}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-5 w-5 shrink-0 rounded-full bg-muted" />
        )}
        <span
          className={cn(
            "truncate text-[11px] font-semibold tracking-wide",
            isTbd && "text-muted-foreground",
          )}
        >
          {isTbd ? "?" : team.abbr}
        </span>
        {isPicked && !isTbd && (
          <Check
            className={cn(
              "h-3 w-3 shrink-0",
              pickedCorrect === false ? "text-red-500" : "text-emerald-500",
            )}
          />
        )}
      </div>

      {/* Scores: actual score only (predicted shown in footer row below) */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Actual score — shown when LIVE or FINISHED */}
        {showScore && (
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              match.status === "LIVE" && "text-primary",
            )}
          >
            {team.score ?? 0}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── BracketMatchCard ─────────────────────────────────────────────────────────

export interface BracketMatchCardProps {
  match: Match | undefined;
  picked?: Pick;
  onPick?: (teamId: string) => void;
}

export function BracketMatchCard({ match, picked, onPick }: BracketMatchCardProps) {
  const { t } = useApp();

  // Empty / placeholder slot — match not yet assigned
  if (!match) {
    return (
      <div className="w-40 overflow-hidden rounded-lg border border-dashed border-border bg-muted/20">
        <div className="px-2 py-1.5">
          <div className="mb-1.5 h-3 w-16 rounded bg-muted/50" />
          <div className="flex flex-col gap-0.5">
            <div className="h-7 rounded bg-muted/40" />
            <div className="mx-2 border-t border-border/50" />
            <div className="h-7 rounded bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  const locked = match.status !== "UPCOMING";
  const pickedTeamId = picked?.teamId;
  const pickedCorrect =
    locked && pickedTeamId !== undefined ? match.winnerId === pickedTeamId : undefined;

  return (
    <div
      className={cn(
        "w-40 overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow",
        match.status === "LIVE" && "border-primary/60 shadow-md shadow-primary/10",
        match.status === "FINISHED" && "border-border",
        match.status === "UPCOMING" && "border-border",
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        {match.status === "LIVE" && <LiveBadge clock={match.displayClock} />}
        {match.status === "FINISHED" && <FinishedBadge decision={match.decision} />}
        {match.status === "UPCOMING" && <UpcomingBadge kickoff={match.kickoff} />}
      </div>

      {/* Teams */}
      <div className="px-1 pb-1.5">
        <BracketTeamRow
          team={match.teamA}
          match={match}
          isPicked={pickedTeamId === match.teamA.id}
          locked={locked}
          pickedCorrect={pickedTeamId === match.teamA.id ? pickedCorrect : undefined}
          onPick={() => onPick?.(match.teamA.id)}
        />

        <div className="mx-2 border-t border-border/50" />

        <BracketTeamRow
          team={match.teamB}
          match={match}
          isPicked={pickedTeamId === match.teamB.id}
          locked={locked}
          pickedCorrect={pickedTeamId === match.teamB.id ? pickedCorrect : undefined}
          onPick={() => onPick?.(match.teamB.id)}
        />
      </div>

      {/* Predicted score footer — shown when user picked both scores */}
      {picked?.scoreA != null && picked?.scoreB != null && (
        <div
          className={cn(
            "mx-1 mb-1.5 flex items-center justify-center gap-1 rounded bg-muted/50 px-2 py-0.5",
            pickedCorrect === true && "bg-emerald-500/10",
            pickedCorrect === false && "bg-red-500/10",
          )}
        >
          <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
            {match.teamA.abbr === "TBD" ? "?" : match.teamA.abbr}
          </span>
          <span
            className={cn(
              "text-[11px] font-bold tabular-nums",
              pickedCorrect === true && "text-emerald-500",
              pickedCorrect === false && "text-red-400",
              pickedCorrect === undefined && "text-foreground",
            )}
          >
            {picked.scoreA}–{picked.scoreB}
          </span>
          <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
            {match.teamB.abbr === "TBD" ? "?" : match.teamB.abbr}
          </span>
        </div>
      )}

      {/* Watch live button — only shown for LIVE matches */}
      {match.status === "LIVE" && (
        <div className="border-t border-border/50 px-2 py-1.5">
          <Link
            href="/live"
            className="flex w-full items-center justify-center gap-1 rounded-md bg-red-500/10 py-1 text-[10px] font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500/20"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            {t("watchLive")}
          </Link>
        </div>
      )}
    </div>
  );
}
