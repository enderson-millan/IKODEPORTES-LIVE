import type { Metadata } from "next";
import { OverlayView } from "./_components/OverlayView";

export const metadata: Metadata = {
  title: "Overlay",
  robots: { index: false, follow: false },
};

interface OverlayPageProps {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OverlayPage({ params, searchParams }: OverlayPageProps) {
  const { gameId } = await params;
  const query = await searchParams;
  const rawPanels = query.panels;
  const panels = Array.isArray(rawPanels) ? rawPanels[0] : rawPanels;

  // Runtime value (server component): switching between localhost and the
  // Cloudflare tunnel does not require rebuilding the web image.
  const wsUrl =
    process.env.LIVE_WS_URL ?? process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

  return <OverlayView gameId={gameId} wsUrl={wsUrl} panels={panels} />;
}
