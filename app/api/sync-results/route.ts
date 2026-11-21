import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeEspnEvent, type EspnRawEvent } from "@/lib/espn-adapter";
import { ESPN_SLUG_MAP } from "@/lib/types";

/**
 * POST /api/sync-results
 *
 * Two responsibilities per run:
 *
 * 1. RESULTS — Upserts FINISHED match results into `match_results`
 *    (winner_team_id, score_a, score_b, stage).
 *
 * 2. LIVE STREAMS — For every LIVE match, finds a pending row in
 *    `live_streams` where match_id IS NULL and team_hint matches one
 *    of the competing teams' abbreviations, then sets match_id.
 *    This lets admins pre-insert YouTube video IDs before a match starts,
 *    using team_hint so the job knows which stream belongs to which match.
 *
 * Protected by a secret key passed in the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Called automatically by Supabase pg_cron every 5 minutes.
 * Can also be triggered manually for testing.
 */

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard" +
  "?limit=100&dates=20260627-20260720";

interface EspnScoreboardResponse {
  events?: EspnRawEvent[];
}

interface MatchResult {
  espnEventId: string;
  winnerId: string;
  scoreA: number;
  scoreB: number;
  stage: string;
}

interface LiveMatch {
  espnEventId: string;
  teamAbbrA: string;
  teamAbbrB: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  // ── Auth: validate secret key ────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Supabase admin client (bypasses RLS) ─────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── Fetch from ESPN ──────────────────────────────────────────────────────
  let events: EspnRawEvent[] = [];

  try {
    const response = await fetch(ESPN_SCOREBOARD_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`ESPN API responded ${response.status}`);
    }

    const data: EspnScoreboardResponse = await response.json();
    events = data.events ?? [];
  } catch (err) {
    console.error("[sync-results] ESPN fetch failed:", err);
    return NextResponse.json({ error: "ESPN fetch failed" }, { status: 502 });
  }

  // ── Classify matches by status ───────────────────────────────────────────
  const finishedResults: MatchResult[] = [];
  const liveMatches: LiveMatch[] = [];

  for (const event of events) {
    const match = normalizeEspnEvent(event);
    if (!match) continue;

    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitorA = competition.competitors?.find((c) => c.order === 0);
    const competitorB = competition.competitors?.find((c) => c.order === 1);
    if (!competitorA || !competitorB) continue;

    // ── LIVE: collect for stream linking ──────────────────────────────────
    if (match.status === "LIVE") {
      liveMatches.push({
        espnEventId: event.id,
        teamAbbrA: competitorA.team.abbreviation,
        teamAbbrB: competitorB.team.abbreviation,
      });
    }

    // ── FINISHED: collect for match_results upsert ────────────────────────
    if (match.status === "FINISHED" && match.winnerId) {
      const scoreA = parseInt(competitorA.score, 10);
      const scoreB = parseInt(competitorB.score, 10);
      if (isNaN(scoreA) || isNaN(scoreB)) continue;

      const stage = ESPN_SLUG_MAP[event.season?.slug ?? ""] ?? "r32";

      finishedResults.push({
        espnEventId: event.id,
        winnerId: match.winnerId,
        scoreA,
        scoreB,
        stage,
      });
    }
  }

  // ── 1. Upsert finished match results ─────────────────────────────────────
  let syncedResults = 0;

  if (finishedResults.length > 0) {
    const { error } = await supabase.from("match_results").upsert(
      finishedResults.map((r) => ({
        espn_event_id: r.espnEventId,
        winner_team_id: r.winnerId,
        score_a: r.scoreA,
        score_b: r.scoreB,
        stage: r.stage,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "espn_event_id" },
    );

    if (error) {
      console.error("[sync-results] match_results upsert failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    syncedResults = finishedResults.length;
    console.log(`[sync-results] Synced ${syncedResults} finished matches`);
  }

  // ── 2. Link pending live_streams to LIVE matches via team_hint ────────────
  let linkedStreams = 0;

  if (liveMatches.length > 0) {
    // Fetch all pending streams (match_id IS NULL, team_hint set, is_active)
    const { data: pendingStreams, error: fetchError } = await supabase
      .from("live_streams")
      .select("id, team_hint")
      .is("match_id", null)
      .not("team_hint", "is", null)
      .eq("is_active", true);

    if (fetchError) {
      console.error("[sync-results] live_streams fetch failed:", fetchError);
    } else if (pendingStreams && pendingStreams.length > 0) {
      for (const stream of pendingStreams) {
        const hint = (stream.team_hint as string).toUpperCase();

        // Find a LIVE match where either team abbreviation matches the hint
        const matchedLive = liveMatches.find(
          (lm) => lm.teamAbbrA.toUpperCase() === hint || lm.teamAbbrB.toUpperCase() === hint,
        );

        if (!matchedLive) continue;

        const { error: updateError } = await supabase
          .from("live_streams")
          .update({ match_id: matchedLive.espnEventId, updated_at: new Date().toISOString() })
          .eq("id", stream.id);

        if (updateError) {
          console.error(`[sync-results] Failed to link stream ${stream.id}:`, updateError);
        } else {
          linkedStreams++;
          console.log(
            `[sync-results] Linked stream ${stream.id} (hint: ${hint}) → match ${matchedLive.espnEventId}`,
          );
        }
      }
    }
  }

  return NextResponse.json({
    syncedResults,
    linkedStreams,
    finished: finishedResults.map((r) => ({
      espnEventId: r.espnEventId,
      stage: r.stage,
      winnerId: r.winnerId,
      score: `${r.scoreA}-${r.scoreB}`,
    })),
    live: liveMatches.map((lm) => `${lm.teamAbbrA} vs ${lm.teamAbbrB} (${lm.espnEventId})`),
  });
}

/**
 * GET /api/sync-results
 * Convenience endpoint for Vercel Cron (cron jobs use GET by default).
 * Delegates to POST with the same auth logic.
 */
export async function GET(request: Request): Promise<NextResponse> {
  return POST(request);
}
