"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Radio, CalendarClock } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useApp } from "@/lib/app-context";
import { AppHeader } from "@/components/AppHeader";
import { MatchCard } from "@/components/MatchCard";
import { useLiveStreams } from "@/hooks/queries/use-live-streams";
import type { Match } from "@/lib/types";

dayjs.extend(utc);

const CAZETV_CHANNEL = "https://www.youtube.com/@CazeTV/live";

export function LiveView() {
  const { t } = useApp();

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: (): Promise<Match[]> =>
      fetch("/api/matches")
        .then((r) => r.json())
        .then((d: { matches?: Match[] }) => d.matches ?? []),
    refetchInterval: (query) => {
      const data = query.state.data ?? [];
      return data.some((m: Match) => m.status === "LIVE") ? 30_000 : false;
    },
  });

  const { data: picks = {} } = useQuery<Record<string, string>>({
    queryKey: ["picks"],
    queryFn: async () => {
      const { getPicks } = await import("@/actions/picks");
      const result = await getPicks();
      if ("success" in result && result.success === false) return {};
      return result as Record<string, string>;
    },
  });

  const { data: streams = [] } = useLiveStreams();

  async function handlePick(matchId: string, teamId: string) {
    const { savePick } = await import("@/actions/picks");
    await savePick(matchId, teamId);
  }

  // Build a map: match_id → YouTube URL (video-specific or channel fallback)
  const streamUrlByMatch = new Map<string, string>();
  streams.forEach((s) => {
    const url = s.youtube_video_id
      ? `https://www.youtube.com/watch?v=${s.youtube_video_id}`
      : CAZETV_CHANNEL;
    streamUrlByMatch.set(s.match_id, url);
  });

  const liveMatches = matches.filter((m) => m.status === "LIVE");

  // UPCOMING matches that have a stream registered
  const streamMatchIds = new Set(streams.map((s) => s.match_id));
  const scheduledWithStream = matches
    .filter((m) => m.status === "UPCOMING" && streamMatchIds.has(m.id))
    .sort((a, b) => dayjs(a.kickoff).unix() - dayjs(b.kickoff).unix());

  // UPCOMING without stream — "next matches" section
  const upcomingMatches = matches
    .filter((m) => m.status === "UPCOMING" && !streamMatchIds.has(m.id))
    .sort((a, b) => dayjs(a.kickoff).unix() - dayjs(b.kickoff).unix())
    .slice(0, 4);

  const featuredMatches = [...liveMatches, ...scheduledWithStream];
  const hasNoContent = !matchesLoading && featuredMatches.length === 0;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <AppHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <Radio className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("livePageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("livePageSubtitle")}</p>
          </div>
        </div>

        {/* Loading */}
        {matchesLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          </div>
        )}

        {/* Featured: LIVE + UPCOMING com stream */}
        {!matchesLoading && featuredMatches.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  picked={picks[match.id]}
                  onPick={(teamId) => handlePick(match.id, teamId)}
                  streamUrl={streamUrlByMatch.get(match.id) ?? CAZETV_CHANNEL}
                />
              ))}
            </div>
          </section>
        )}

        {/* No content */}
        {hasNoContent && (
          <div className="mb-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <Radio className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-base font-medium text-muted-foreground">{t("noLiveMatches")}</p>
            <Link
              href="/bracket"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("bracket")} →
            </Link>
          </div>
        )}

        {/* Próximos jogos */}
        {!matchesLoading && upcomingMatches.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("nextMatches")}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {upcomingMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  picked={picks[match.id]}
                  onPick={(teamId) => handlePick(match.id, teamId)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
