import type { Metadata } from "next";
import { BracketView } from "@/components/BracketView";

export const metadata: Metadata = {
  title: "Chaveamento — MataMata.live",
};

export default function BracketRoute() {
  return <BracketView />;
}
