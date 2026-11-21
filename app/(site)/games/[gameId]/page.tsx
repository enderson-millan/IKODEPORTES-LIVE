import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_GAME_ID, demoGame } from "@shared/fixtures/demo-game";
import { GameDetailView } from "./_components/GameDetailView";

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;
  if (gameId !== DEMO_GAME_ID) {
    return { title: "Partido" };
  }

  return {
    title: `${demoGame.matchup.away.name} vs ${demoGame.matchup.home.name}`,
    description: `Seguimiento en vivo: ${demoGame.matchup.away.name} vs ${demoGame.matchup.home.name}.`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;

  // Phase 3 will resolve persisted games through the API. Until then only the
  // canonical demo fixture exists, and unknown ids are a real 404.
  if (gameId !== DEMO_GAME_ID) {
    notFound();
  }

  return <GameDetailView state={demoGame} />;
}
