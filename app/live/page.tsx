import type { Metadata } from "next";
import { LiveView } from "./_components/LiveView";

export const metadata: Metadata = {
  title: "Ao Vivo — MataMata.live",
};

export default function LiveRoute() {
  return <LiveView />;
}
