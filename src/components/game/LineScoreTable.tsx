"use client";

import type {
  CanonicalBaseballState,
  TeamLineScore,
  TeamIdentity,
} from "@shared/types/baseball-state";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

interface LineScoreTableProps {
  state: CanonicalBaseballState;
  compact?: boolean;
}

function TeamRow({
  team,
  line,
  currentInning,
  currentHalf,
  isHome,
  compact,
}: {
  team: TeamIdentity;
  line: TeamLineScore;
  currentInning: number;
  currentHalf: "TOP" | "BOTTOM";
  isHome: boolean;
  compact: boolean;
}) {
  return (
    <tr className="border-t border-white/5">
      <th
        scope="row"
        className={cn("whitespace-nowrap text-left", compact ? "py-1 pr-1" : "py-2 pr-3")}
      >
        <span className="font-display text-xs font-black uppercase text-brand-gold-ink">
          {team.code}
        </span>
        <span className="ml-1.5 hidden text-xs text-muted-foreground sm:inline">
          {team.shortName}
        </span>
      </th>
      {line.innings.map((inning) => {
        const active =
          inning.inning === currentInning &&
          (isHome ? currentHalf === "BOTTOM" : currentHalf === "TOP");
        return (
          <td
            key={inning.inning}
            className={cn(
              compact
                ? "px-0.5 py-1 text-center tabular-nums"
                : "px-1 py-2 text-center tabular-nums",
              active
                ? "bg-live/25 font-display font-black text-live-ink ring-1 ring-inset ring-live/40"
                : "text-foreground/80",
            )}
          >
            {inning.runs ?? "–"}
          </td>
        );
      })}
      <td className="px-1 py-2 text-center font-bold tabular-nums text-brand-gold-ink">{line.runs}</td>
      <td className="px-1 py-2 text-center tabular-nums text-muted-foreground">{line.hits}</td>
      <td className="px-1 py-2 text-center tabular-nums text-muted-foreground">{line.errors}</td>
    </tr>
  );
}

export function LineScoreTable({ state, compact = false }: LineScoreTableProps) {
  const { t } = useApp();
  const innings = state.lineScore.away.innings;

  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-xs", compact ? "text-[10px]" : "min-w-[420px]")}>
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="pb-2" />
            {innings.map((inning) => (
              <th key={inning.inning} className="px-1 pb-2 text-center font-semibold">
                {inning.inning}
              </th>
            ))}
            <th className="px-1 pb-2 text-center font-bold text-foreground">{t("runs")}</th>
            <th className="px-1 pb-2 text-center font-bold text-foreground">{t("hits")}</th>
            <th className="px-1 pb-2 text-center font-bold text-foreground">{t("errors")}</th>
          </tr>
        </thead>
        <tbody>
          <TeamRow
            team={state.matchup.away}
            line={state.lineScore.away}
            currentInning={state.clock.inning}
            currentHalf={state.clock.half}
            isHome={false}
            compact={compact}
          />
          <TeamRow
            team={state.matchup.home}
            line={state.lineScore.home}
            currentInning={state.clock.inning}
            currentHalf={state.clock.half}
            isHome
            compact={compact}
          />
        </tbody>
      </table>
    </div>
  );
}
