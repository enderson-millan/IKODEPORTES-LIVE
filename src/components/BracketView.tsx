/* eslint-disable prettier/prettier */
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/app-context";
import { AppHeader } from "@/components/AppHeader";
import { BracketMatchCard } from "@/components/BracketMatchCard";
import { getPicks, savePick } from "@/actions/picks";
import { bracketColumns, getMatchIndexForSlot } from "@/lib/bracket-structure";
import { stageOrder } from "@/lib/types";
import type { Match, Pick, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BracketPickerDrawer } from "@/components/BracketPickerDrawer";
import trophy from "@/assets/trophy.png";
import mascot from "@/assets/mascot.png";

// i18n key → display label (resolved via t())
const STAGE_I18N_KEYS: Record<Stage, Parameters<ReturnType<typeof useApp>["t"]>[0]> = {
  r32: "r32",
  r16: "r16",
  qf: "qf",
  sf: "sf",
  third: "third",
  final: "final",
};

export function BracketView() {
  const { t } = useApp();
  const queryClient = useQueryClient();

  const [drawerMatch, setDrawerMatch] = useState<Match | null>(null);

  // ── Desktop bracket auto-scale ──────────────────────────────────────────
  const BRACKET_NATURAL_WIDTH = 1824;
  const BRACKET_NATURAL_HEIGHT = 960; // altura natural generosa para conter troféu + cards + mascote
  const desktopWrapperRef = useRef<HTMLDivElement>(null);
  const [bracketScale, setBracketScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!desktopWrapperRef.current) return;
      const availableWidth = desktopWrapperRef.current.clientWidth;
      const scale = Math.min(1, availableWidth / BRACKET_NATURAL_WIDTH);
      setBracketScale(scale);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // ── Fetch matches ────────────────────────────────────────────────────────
  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[], Error, Match[]>({
    queryKey: ["matches"],
    queryFn: (): Promise<Match[]> =>
      fetch("/api/matches")
        .then((r) => r.json())
        .then((d: { matches?: Match[] }) => d.matches ?? []),
    refetchInterval: (query): number | false => {
      const data = query.state.data ?? [];
      return data.some((m: Match) => m.status === "LIVE") ? 30_000 : false;
    },
  });

  // ── Fetch picks ──────────────────────────────────────────────────────────
  const { data: picks = {} } = useQuery<Record<string, Pick>>({
    queryKey: ["picks"],
    queryFn: async () => {
      const result = await getPicks();
      if ("success" in result && result.success === false) return {};
      return result as Record<string, Pick>;
    },
  });

  // ── Save pick with optimistic update ────────────────────────────────────
  const mutation = useMutation({
    mutationFn: ({
      espnEventId,
      teamId,
      scoreA,
      scoreB,
    }: {
      espnEventId: string;
      teamId: string;
      scoreA?: number;
      scoreB?: number;
    }) => savePick(espnEventId, teamId, scoreA, scoreB),
    onMutate: async ({ espnEventId, teamId, scoreA, scoreB }) => {
      await queryClient.cancelQueries({ queryKey: ["picks"] });
      const snapshot = queryClient.getQueryData<Record<string, Pick>>(["picks"]);
      queryClient.setQueryData(["picks"], (old: Record<string, Pick> = {}) => ({
        ...old,
        [espnEventId]: { teamId, scoreA, scoreB },
      }));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => queryClient.setQueryData(["picks"], ctx?.snapshot),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["picks"] }),
  });

  const handlePick = (matchId: string, teamId: string, scoreA?: number, scoreB?: number) =>
    mutation.mutate({ espnEventId: matchId, teamId, scoreA, scoreB });

  // ── Group matches by stage ───────────────────────────────────────────────
  const matchesByStage = stageOrder.reduce<Record<Stage, Match[]>>(
    (acc, stage) => {
      acc[stage] = matches.filter((m) => m.stage === stage);
      return acc;
    },
    { r32: [], r16: [], qf: [], sf: [], third: [], final: [] },
  );

  function resolveSlotMatch(
    stage: Stage,
    slotIndex: number,
    side: "left" | "right" | "center",
  ): Match | undefined {
    const stageMatches = matchesByStage[stage];
    const fakeSlot = { stage, side, index: slotIndex, slotId: "" };
    const matchIdx = getMatchIndexForSlot(fakeSlot, stageMatches.length);
    return stageMatches[matchIdx];
  }

  const hasLive = matches.some((m) => m.status === "LIVE");

  // ── Live badge (shared between mobile/desktop) ───────────────────────────
  const liveBadge = hasLive ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      {t("liveMatch")}
    </span>
  ) : null;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <AppHeader />

      {/* ════════════════════════════════════════════
          MOBILE — título fora do scroll, bracket isolado
          ════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col md:hidden">
        {/* Título — sem overflow, nunca se move com scroll horizontal */}
        <div className="flex flex-col items-center px-4 pb-3 pt-4 text-center">
          <div className="flex w-full items-center justify-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("bracket")}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("bracketSubtitle")}</p>
            </div>
            {liveBadge}
          </div>
        </div>

        {matchesLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <p className="mb-2 px-4 text-center text-[10px] text-muted-foreground">
              ← Deslize para ver o chaveamento completo · Toque para palpitar →
            </p>

            {/* Scroll container isolado — só o bracket rola, nada acima se move */}
            <div
              className="overflow-x-auto overflow-y-hidden pb-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div
                style={{
                  transform: "scale(0.55)",
                  transformOrigin: "top left",
                  width: "1800px",
                }}
              >
                <div
                  className="inline-flex min-w-max items-stretch gap-0"
                  style={{ minHeight: "720px" }}
                >
                  {bracketColumns.map((col, colIdx) => {
                    const isCenter = col.side === "center";
                    const isFirst = colIdx === 0;
                    const isLast = colIdx === bracketColumns.length - 1;
                    const colMatches = col.slots.map((slot) =>
                      resolveSlotMatch(slot.stage, slot.index, slot.side),
                    );
                    const label = t(STAGE_I18N_KEYS[col.stage]);

                    if (isCenter) {
                      return (
                        <div
                          key={`mob-col-${colIdx}`}
                          className="flex w-52 flex-col items-center px-2"
                        >
                          <span className="mb-3 block w-full rounded-md bg-primary/10 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-primary">
                            {label}
                          </span>

                          <div
                            className="relative mb-2 flex justify-center"
                            style={{ width: 90, height: 106 }}
                          >
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background:
                                  "radial-gradient(ellipse 80% 70% at 50% 60%, rgba(255,200,40,0.55) 0%, rgba(255,160,0,0.25) 45%, transparent 75%)",
                                filter: "blur(8px)",
                                transform: "scale(1.3)",
                              }}
                              aria-hidden="true"
                            />
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background:
                                  "radial-gradient(ellipse 120% 100% at 50% 65%, rgba(255,215,80,0.18) 0%, transparent 70%)",
                                filter: "blur(14px)",
                                transform: "scale(1.7)",
                              }}
                              aria-hidden="true"
                            />
                            <Image
                              src={trophy}
                              alt="Troféu"
                              fill
                              className="relative object-contain drop-shadow-2xl"
                              sizes="90px"
                            />
                          </div>

                          <div className="flex w-full flex-col items-center gap-4">
                            <div className="flex w-full items-center">
                              <div className="h-px w-4 shrink-0 bg-border" />
                              <div
                                className="flex flex-1 cursor-pointer justify-center"
                                onClick={() => colMatches[0] && setDrawerMatch(colMatches[0])}
                              >
                                <BracketMatchCard
                                  match={colMatches[0]}
                                  picked={colMatches[0]?.id ? picks[colMatches[0].id] : undefined}
                                />
                              </div>
                              <div className="h-px w-4 shrink-0 bg-border" />
                            </div>

                            <div className="w-full border-t border-dashed border-border pt-4">
                              <span className="mb-2 block text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                {t("third")}
                              </span>
                              <div
                                className="flex cursor-pointer justify-center"
                                onClick={() => colMatches[1] && setDrawerMatch(colMatches[1])}
                              >
                                <BracketMatchCard
                                  match={colMatches[1]}
                                  picked={colMatches[1]?.id ? picks[colMatches[1].id] : undefined}
                                />
                              </div>
                            </div>

                            <div className="pointer-events-none flex justify-center pt-2">
                              <div className="relative" style={{ width: 160, height: 190 }}>
                                <Image
                                  src={mascot}
                                  alt="Mascote"
                                  fill
                                  className="object-contain drop-shadow-xl"
                                  sizes="160px"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`mob-col-${colIdx}`}
                        className={cn(
                          "flex flex-col",
                          col.stage === "r32" && "w-48",
                          col.stage === "r16" && "w-48",
                          col.stage === "qf" && "w-48",
                          col.stage === "sf" && "w-48",
                        )}
                      >
                        <span className="mb-3 block rounded-md bg-muted/60 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {label}
                        </span>

                        <div className="flex flex-1 flex-col justify-around">
                          {col.slots.map((slot, slotIdx) => {
                            const match = colMatches[slotIdx];
                            const matchId = match?.id;
                            return (
                              <div key={slot.slotId} className="relative flex flex-1 items-center">
                                {!isFirst && <div className="h-px w-4 shrink-0 bg-border" />}
                                <div
                                  className={cn("flex-1", match && "cursor-pointer")}
                                  onClick={() => match && setDrawerMatch(match)}
                                >
                                  <BracketMatchCard
                                    match={match}
                                    picked={matchId ? picks[matchId] : undefined}
                                  />
                                </div>
                                {!isLast && (
                                  <ConnectorBracket
                                    slotIndex={slotIdx}
                                    totalSlots={col.slots.length}
                                    side={col.side as "left" | "right"}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <BracketPickerDrawer
              match={drawerMatch}
              picked={drawerMatch?.id ? picks[drawerMatch.id] : undefined}
              onPick={(teamId, scoreA, scoreB) =>
                drawerMatch && handlePick(drawerMatch.id, teamId, scoreA, scoreB)
              }
              onClose={() => setDrawerMatch(null)}
            />
          </>
        )}
      </div>

      {/* Shared drawer — used by both mobile and desktop */}

      {/* ════════════════════════════════════════════
          DESKTOP — bracket com auto-scale
          ════════════════════════════════════════════ */}
      <main className="mx-auto hidden max-w-[1600px] px-4 py-6 sm:px-6 md:block">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{t("bracket")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("bracketSubtitle")}</p>
          </div>
          {liveBadge}
        </div>

        {matchesLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <div
            ref={desktopWrapperRef}
            className="w-full overflow-x-hidden"
            style={{ height: `${Math.round(BRACKET_NATURAL_HEIGHT * bracketScale)}px` }}
          >
            <div
              style={{
                transform: `scale(${bracketScale})`,
                transformOrigin: "top left",
                width: `${BRACKET_NATURAL_WIDTH}px`,
              }}
            >
              <div
                className="inline-flex min-w-max items-stretch gap-0"
                style={{ minHeight: "720px" }}
              >
                {bracketColumns.map((col, colIdx) => {
                  const isCenter = col.side === "center";
                  const isFirst = colIdx === 0;
                  const isLast = colIdx === bracketColumns.length - 1;
                  const colMatches = col.slots.map((slot) =>
                    resolveSlotMatch(slot.stage, slot.index, slot.side),
                  );
                  const label = t(STAGE_I18N_KEYS[col.stage]);

                  if (isCenter) {
                    return (
                      <div key={`col-${colIdx}`} className="flex w-52 flex-col items-center px-2">
                        <span className="mb-3 block w-full rounded-md bg-primary/10 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-primary">
                          {label}
                        </span>

                        <div
                          className="relative mb-2 flex justify-center"
                          style={{ width: 90, height: 106 }}
                        >
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background:
                                "radial-gradient(ellipse 80% 70% at 50% 60%, rgba(255,200,40,0.55) 0%, rgba(255,160,0,0.25) 45%, transparent 75%)",
                              filter: "blur(8px)",
                              transform: "scale(1.3)",
                            }}
                            aria-hidden="true"
                          />
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background:
                                "radial-gradient(ellipse 120% 100% at 50% 65%, rgba(255,215,80,0.18) 0%, transparent 70%)",
                              filter: "blur(14px)",
                              transform: "scale(1.7)",
                            }}
                            aria-hidden="true"
                          />
                          <Image
                            src={trophy}
                            alt="Troféu"
                            fill
                            className="relative object-contain drop-shadow-2xl"
                            sizes="90px"
                          />
                        </div>

                        <div className="flex w-full flex-col items-center gap-4">
                          <div className="flex w-full items-center">
                            <div className="h-px w-4 shrink-0 bg-border" />
                            <div
                              className="flex flex-1 cursor-pointer justify-center"
                              onClick={() => colMatches[0] && setDrawerMatch(colMatches[0])}
                            >
                              <BracketMatchCard
                                match={colMatches[0]}
                                picked={colMatches[0]?.id ? picks[colMatches[0].id] : undefined}
                              />
                            </div>
                            <div className="h-px w-4 shrink-0 bg-border" />
                          </div>

                          <div className="w-full border-t border-dashed border-border pt-4">
                            <span className="mb-2 block text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                              {t("third")}
                            </span>
                            <div
                              className="flex cursor-pointer justify-center"
                              onClick={() => colMatches[1] && setDrawerMatch(colMatches[1])}
                            >
                              <BracketMatchCard
                                match={colMatches[1]}
                                picked={colMatches[1]?.id ? picks[colMatches[1].id] : undefined}
                              />
                            </div>
                          </div>

                          <div className="pointer-events-none flex justify-center pt-2">
                            <div className="relative" style={{ width: 160, height: 190 }}>
                              <Image
                                src={mascot}
                                alt="Mascote"
                                fill
                                className="object-contain drop-shadow-xl"
                                sizes="160px"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`col-${colIdx}`}
                      className={cn(
                        "flex flex-col",
                        col.stage === "r32" && "w-48",
                        col.stage === "r16" && "w-48",
                        col.stage === "qf" && "w-48",
                        col.stage === "sf" && "w-48",
                      )}
                    >
                      <span className="mb-3 block rounded-md bg-muted/60 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {label}
                      </span>

                      <div className="flex flex-1 flex-col justify-around">
                        {col.slots.map((slot, slotIdx) => {
                          const match = colMatches[slotIdx];
                          const matchId = match?.id;
                          return (
                            <div key={slot.slotId} className="relative flex flex-1 items-center">
                              {!isFirst && <div className="h-px w-4 shrink-0 bg-border" />}
                              <div
                                className={cn("flex-1", match && "cursor-pointer")}
                                onClick={() => match && setDrawerMatch(match)}
                              >
                                <BracketMatchCard
                                  match={match}
                                  picked={matchId ? picks[matchId] : undefined}
                                />
                              </div>
                              {!isLast && (
                                <ConnectorBracket
                                  slotIndex={slotIdx}
                                  totalSlots={col.slots.length}
                                  side={col.side as "left" | "right"}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── ConnectorBracket ────────────────────────────────────────────────────────

function ConnectorBracket({
  slotIndex,
  totalSlots,
  side,
}: {
  slotIndex: number;
  totalSlots: number;
  side: "left" | "right";
}) {
  const isTop = slotIndex % 2 === 0;

  return (
    <div className="flex h-full w-5 shrink-0 flex-col">
      {isTop ? (
        <>
          <div className="flex-1" />
          <div
            className={cn(
              "flex-1 border-border",
              side === "left" ? "rounded-tr border-r border-t" : "rounded-tl border-l border-t",
            )}
          />
        </>
      ) : (
        <>
          <div
            className={cn(
              "flex-1 border-border",
              side === "left" ? "rounded-br border-b border-r" : "rounded-bl border-b border-l",
            )}
          />
          <div className="flex-1" />
        </>
      )}
    </div>
  );
}
