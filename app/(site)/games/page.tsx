import type { Metadata } from "next";
import type { GameSummary } from "@shared/types/baseball-state";
import { demoGameSummary } from "@shared/fixtures/demo-game";
import { fetchGameSummaries } from "@/lib/live-api";
import { GamesListView } from "./_components/GamesListView";

export const metadata: Metadata = {
  title: "Partidos",
  description: "Partidos y seguimiento en vivo de béisbol y softbol.",
};

export const dynamic = "force-dynamic";

const STATUS_ORDER: Record<GameSummary["status"], number> = {
  LIVE: 0,
  SCHEDULED: 1,
  FINAL: 2,
  POSTPONED: 3,
  CANCELED: 4,
};

export default async function GamesPage() {
  let games: GameSummary[] = [];
  let apiOffline = false;

  try {
    games = await fetchGameSummaries();
  } catch {
    apiOffline = true;
  }

  // Keep the shell usable if the local API is down; never fake a live game.
  if (apiOffline) {
    games = [demoGameSummary];
  } else {
    games.sort((left, right) => STATUS_ORDER[left.status] - STATUS_ORDER[right.status]);
  }

  return <GamesListView games={games} apiOffline={apiOffline} />;
}
