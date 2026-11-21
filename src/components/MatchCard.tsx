"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Play } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { Match, Stage, Team } from "@/lib/types";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

dayjs.extend(utc);

// ─── Stage labels in English (matching the reference image) ──────────────────
const STAGE_LABEL: Record<Stage, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-finals",
  sf: "Semi-finals",
  third: "Third Place",
  final: "Final",
};

// ─── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Match["status"] }) {
  const { t } = useApp();

  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        {t("live")}
      </span>
    );
  }

  if (status === "FINISHED") {
    return (
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {t("finished")}
      </span>
    );
  }

  // UPCOMING
  return (
    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600">
      {t("upcoming")}
    </span>
  );
}

// ─── Team row ─────────────────────────────────────────────────────────────────

interface TeamRowProps {
  team: Team;
  match: Match;
  isPicked: boolean;
  locked: boolean;
  correct?: boolean;
  onPick: () => void;
}

function TeamRow({ team, match, isPicked, locked, correct, onPick }: TeamRowProps) {
  const showScore = match.status !== "UPCOMING";

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onPick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors",
        // Selected state — green tint with border
        isPicked && correct !== false && "border border-emerald-400 bg-emerald-50",
        // Wrong pick — red tint
        isPicked && correct === false && "border border-red-300 bg-red-50",
        // Unselected + unlocked — subtle hover
        !isPicked && !locked && "border border-transparent hover:bg-gray-50",
        // Unselected + locked — plain, slightly dimmed
        !isPicked && locked && "border border-transparent opacity-70",
        locked && "cursor-default",
      )}
    >
      {/* Logo + name */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200">
          {team.logo ? (
            <Image
              src={team.logo}
              alt={team.name}
              width={28}
              height={28}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-100" />
          )}
        </div>
        <span className="truncate text-sm font-medium text-gray-800">{team.name}</span>
        {isPicked && (
          <Check
            className={cn(
              "h-4 w-4 shrink-0",
              correct === false ? "text-red-500" : "text-emerald-500",
            )}
          />
        )}
      </div>

      {/* Score (only when LIVE or FINISHED) */}
      {showScore && (
        <span className="text-base font-semibold tabular-nums text-gray-800">
          {team.score ?? 0}
        </span>
      )}
    </button>
  );
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: Match;
  picked?: string;
  onPick?: (teamId: string) => void;
  /** Optional YouTube URL — shows "Assistir ao Vivo" button when provided */
  streamUrl?: string;
}

export function MatchCard({ match, picked, onPick, streamUrl }: MatchCardProps) {
  const locked = match.status !== "UPCOMING";

  const dateLabel =
    match.status === "UPCOMING"
      ? dayjs(match.kickoff).format("DD/MM HH:mm")
      : dayjs(match.kickoff).format("DD/MM");

  const pickedCorrect = locked && picked !== undefined ? match.winnerId === picked : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Card header: status pill + date */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <StatusPill status={match.status} />
        <div className="flex items-center gap-2">
          {/* Watch live button — shown when a stream URL is provided */}
          {streamUrl && (
            <Link
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-600"
            >
              <Play className="h-2.5 w-2.5 fill-white" aria-hidden="true" />
              Assistir ao Vivo
            </Link>
          )}
          <span className="text-xs tabular-nums text-gray-400">{dateLabel}</span>
        </div>
      </div>

      {/* Stage label banner */}
      <div className="mx-3 mb-2 rounded-md bg-blue-50 py-1.5 text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          {STAGE_LABEL[match.stage]}
        </span>
      </div>

      {/* Teams */}
      <div className="px-2 pb-2">
        <TeamRow
          team={match.teamA}
          match={match}
          isPicked={picked === match.teamA.id}
          locked={locked}
          correct={picked === match.teamA.id ? pickedCorrect : undefined}
          onPick={() => onPick?.(match.teamA.id)}
        />

        {/* Divider */}
        <div className="mx-3 border-t border-gray-100" />

        <TeamRow
          team={match.teamB}
          match={match}
          isPicked={picked === match.teamB.id}
          locked={locked}
          correct={picked === match.teamB.id ? pickedCorrect : undefined}
          onPick={() => onPick?.(match.teamB.id)}
        />
      </div>
    </div>
  );
}
