import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { GameSummary } from "@shared/types/baseball-state";
import { demoGame, demoGameSummary } from "@shared/fixtures/demo-game";
import { fetchGameState, fetchGameSummaries } from "@/lib/live-api";
import { GameLiveView } from "./_components/GameLiveView";

export const dynamic = "force-dynamic";

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;
  if (gameId === "demo-live") {
    return { title: `${demoGame.matchup.away.name} vs ${demoGame.matchup.home.name}` };
  }
  return { title: "Partido en vivo" };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const isDemo = gameId === "demo-live";

  if (!isDemo && !/^\d{4,12}$/.test(gameId)) {
    notFound();
  }

  const initialState = isDemo ? demoGame : await fetchGameState(gameId);
  if (!initialState) {
    notFound();
  }

  // The slate is decorative: a discovery failure must never break the tracker.
  let slate: GameSummary[] = [];
  try {
    slate = await fetchGameSummaries();
  } catch {
    slate = [];
  }
  if (slate.length === 0 && isDemo) {
    slate = [demoGameSummary];
  }

  const wsUrl =
    process.env.LIVE_WS_URL || process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

  return <GameLiveView gameId={gameId} wsUrl={wsUrl} initialState={initialState} slate={slate} />;
}
