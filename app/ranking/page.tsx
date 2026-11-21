import type { Metadata } from "next";
import { RankingView } from "@/components/RankingView";

export const metadata: Metadata = {
  title: "Ranking — MataMata.live",
};

export default function RankingRoute() {
  return <RankingView />;
}
