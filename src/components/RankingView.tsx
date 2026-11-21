"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/app-context";
import { AppHeader } from "@/components/AppHeader";
import { getRanking } from "@/actions/ranking";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { RankRow } from "@/lib/types";

// ─── Trend icon ───────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: RankRow["trend"] }) {
  if (trend === "up")
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-emerald-500" fill="none" aria-hidden>
        <path
          d="M2 11 C4 9, 6 6, 8 7 C10 8, 12 5, 14 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="10,3 14,3 14,7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  if (trend === "down")
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-red-500" fill="none" aria-hidden>
        <path
          d="M2 5 C4 7, 6 10, 8 9 C10 8, 12 11, 14 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="10,13 14,13 14,9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  // flat
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-muted-foreground" fill="none" aria-hidden>
      <line
        x1="2"
        y1="8"
        x2="14"
        y2="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Medal / Crown icon ───────────────────────────────────────────────────────

function MedalIcon({ position }: { position: 1 | 2 | 3 }) {
  if (position === 1)
    return (
      // Crown SVG
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" fill="currentColor" aria-hidden>
        <path d="M2 19h20v2H2v-2ZM2 7l5 5 5-7 5 7 5-5v10H2V7Z" />
      </svg>
    );
  if (position === 2)
    return (
      // Silver medal
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="currentColor" aria-hidden>
        <circle cx="12" cy="10" r="6" />
        <path d="M8 20h8l-1-4H9l-1 4Z" />
        <path d="M10 16h4v2h-4z" />
      </svg>
    );
  // Bronze
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-700" fill="currentColor" aria-hidden>
      <circle cx="12" cy="10" r="6" />
      <path d="M8 20h8l-1-4H9l-1 4Z" />
      <path d="M10 16h4v2h-4z" />
    </svg>
  );
}

// ─── Podium card ──────────────────────────────────────────────────────────────

const PODIUM_STYLES = {
  1: {
    card: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 shadow-lg",
    avatar: "border-amber-300 dark:border-amber-700",
    points: "text-amber-600 dark:text-amber-400",
    order: "order-2", // center
    scale: "z-10 scale-105 -mx-1",
  },
  2: {
    card: "bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700/40",
    avatar: "border-slate-300 dark:border-slate-600",
    points: "text-slate-600 dark:text-slate-300",
    order: "order-1", // left
    scale: "",
  },
  3: {
    card: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/40",
    avatar: "border-orange-300 dark:border-orange-700",
    points: "text-orange-700 dark:text-orange-400",
    order: "order-3", // right
    scale: "",
  },
} as const;

function PodiumCard({ row, position }: { row: RankRow; position: 1 | 2 | 3 }) {
  const s = PODIUM_STYLES[position];

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center rounded-2xl border p-3 sm:p-4 text-center transition-shadow hover:shadow-md",
        s.card,
        s.order,
        s.scale,
      )}
    >
      {/* Avatar */}
      <Avatar
        className={cn(position === 1 ? "h-20 w-20" : "h-16 w-16", "border-2 shadow-sm", s.avatar)}
      >
        <AvatarImage src={row.avatarUrl} alt={row.name} />
        <AvatarFallback className="text-base font-bold text-foreground bg-background">
          {row.avatarFallback}
        </AvatarFallback>
      </Avatar>

      {/* Medal + rank */}
      <div className="mt-2 flex items-center gap-1">
        <MedalIcon position={position} />
        <span className="text-xs font-bold text-muted-foreground">#{row.rank}</span>
      </div>

      {/* Name — mobile: first name only; desktop: full name */}
      <p className="mt-0.5 w-full truncate text-center text-sm font-semibold">
        {/* Mobile: first name */}
        <span className="sm:hidden">{row.name.split(" ")[0]}</span>
        {/* Desktop: full name */}
        <span className="hidden sm:inline">{row.name}</span>
      </p>

      {/* Points */}
      <p className={cn("mt-1 text-2xl font-black tabular-nums", s.points)}>
        {row.points} <span className="text-sm font-semibold">pts</span>
      </p>
      {/* Exact hits badge */}
      {row.exactHits > 0 && (
        <span className="mt-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
          🎯 {row.exactHits} exato{row.exactHits > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─── Ranking table row ────────────────────────────────────────────────────────

function RankingRow({ row }: { row: RankRow }) {
  const { t } = useApp();

  return (
    <tr
      className={cn(
        "border-b last:border-0 transition-colors",
        row.isMe ? "bg-emerald-500/10 font-semibold" : "hover:bg-muted/40",
      )}
    >
      {/* Rank */}
      <td className="w-10 py-3 pl-3 text-sm font-medium tabular-nums text-muted-foreground sm:w-12 sm:pl-4">
        #{row.rank}
      </td>

      {/* User */}
      <td className="py-3 pr-2">
        <div className="flex items-center gap-2">
          <Avatar
            className={cn(
              "h-7 w-7 shrink-0 border sm:h-8 sm:w-8",
              row.isMe && "border-emerald-400",
            )}
          >
            <AvatarImage src={row.avatarUrl} alt={row.name} />
            <AvatarFallback
              className={cn(
                "text-xs font-bold",
                row.isMe
                  ? "bg-emerald-500 text-white"
                  : "bg-linear-to-br from-emerald-500 to-sky-500 text-white",
              )}
            >
              {row.avatarFallback}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm">{row.name}</p>
            {row.isMe && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t("yourPositionLabel")}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Points */}
      <td className="py-3 pr-2 text-right text-sm font-semibold tabular-nums sm:pr-3">
        {row.points}
      </td>

      {/* Hits — hidden on smallest screens */}
      <td className="hidden py-3 pr-3 text-right text-sm tabular-nums text-muted-foreground sm:table-cell">
        {row.hits}
      </td>

      {/* Exact hits — hidden on smaller screens */}
      <td className="hidden py-3 pr-3 text-right text-sm tabular-nums text-muted-foreground lg:table-cell">
        {row.exactHits > 0 ? (
          <span className="font-semibold text-amber-600 dark:text-amber-400">{row.exactHits}</span>
        ) : (
          <span>—</span>
        )}
      </td>

      {/* Trend */}
      <td className="py-3 pr-3 text-right sm:pr-4">
        <div className="flex justify-end">
          <TrendIcon trend={row.trend} />
        </div>
      </td>
    </tr>
  );
}

// ─── RankingView ──────────────────────────────────────────────────────────────

export function RankingView() {
  const { t } = useApp();

  const { data: ranking = [], isLoading } = useQuery<RankRow[]>({
    queryKey: ["ranking"],
    queryFn: () => getRanking(),
  });

  const top3 = ranking.slice(0, 3);
  // Table starts from #4 — top 3 are shown in the podium
  const tableRows = ranking.slice(3);
  // "My row" pinned at bottom only if outside top 3 and not already in tableRows
  const myRow = ranking.find((r) => r.isMe && r.rank > ranking.length);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden>
              <path d="M2 19h20v2H2v-2ZM2 7l5 5 5-7 5 7 5-5v10H2V7Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">{t("ranking")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("rankingSubtitle")}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            {top3.length === 3 && (
              <div className="mb-6 flex items-stretch gap-2 sm:gap-3 overflow-hidden">
                {/* Render order: 2nd (left), 1st (center, scaled up), 3rd (right) */}
                {top3[1] && <PodiumCard row={top3[1]} position={2} />}
                {top3[0] && <PodiumCard row={top3[0]} position={1} />}
                {top3[2] && <PodiumCard row={top3[2]} position={3} />}
              </div>
            )}

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-0">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="w-10 py-3 pl-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:w-12 sm:pl-4">
                        #
                      </th>
                      <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("user")}
                      </th>
                      <th className="py-3 pr-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:pr-3">
                        {t("points")}
                      </th>
                      <th className="hidden py-3 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                        {t("accuracy")}
                      </th>
                      <th className="hidden py-3 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                        🎯
                      </th>
                      <th className="py-3 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:pr-4">
                        {t("trend")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <RankingRow key={row.userId} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── My row pinned at bottom (only if rank > total displayed) ── */}
            {myRow && (
              <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-sm">
                <table className="w-full min-w-0">
                  <tbody>
                    <RankingRow row={myRow} />
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
