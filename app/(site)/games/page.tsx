import type { Metadata } from "next";
import { demoGame } from "@shared/fixtures/demo-game";
import { GamesListView } from "./_components/GamesListView";

export const metadata: Metadata = {
  title: "Partidos",
  description: "Partidos y seguimiento en vivo de béisbol y softbol.",
};

export default function GamesPage() {
  return <GamesListView games={[demoGame]} />;
}
