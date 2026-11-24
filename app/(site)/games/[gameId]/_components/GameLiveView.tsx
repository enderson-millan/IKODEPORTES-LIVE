"use client";

import type { CanonicalBaseballState, GameSummary } from "@shared/types/baseball-state";
import { useLiveGame } from "@/hooks/use-live-game";
import { useApp } from "@/lib/app-context";
import { GameDetailView } from "./GameDetailView";

interface GameLiveViewProps {
  gameId: string;
  wsUrl: string;
  initialState: CanonicalBaseballState;
  slate?: GameSummary[];
}

/**
 * Client bridge: paints the server-fetched state and keeps it fresh over the
 * game room. Opening this page also starts polling (idempotent POST /start).
 */
export function GameLiveView({ gameId, wsUrl, initialState, slate = [] }: GameLiveViewProps) {
  const { t } = useApp();
  const { state } = useLiveGame(gameId, { wsUrl, fallback: initialState });

  if (!state) {
    return (
      <div className="bg-stadium flex min-h-[60vh] items-center justify-center">
        <p className="rounded-xl border border-white/10 bg-surface-2/80 px-6 py-4 text-sm text-muted-foreground">
          {t("connecting")}
        </p>
      </div>
    );
  }

  return <GameDetailView state={state} slate={slate} />;
}
