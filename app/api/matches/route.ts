import { NextResponse } from "next/server";
import { normalizeEspnEvent, type EspnRawEvent } from "@/lib/espn-adapter";
import { getRevalidateSeconds } from "@/lib/espn-adapter";
import { mockMatches } from "@/lib/mock-matches";
import type { Match } from "@/lib/types";

/**
 * ESPN scoreboard endpoint with a date range covering the entire
 * FIFA World Cup 2026 knockout stage (R32 through Final).
 *
 * A single request with ?dates=YYYYMMDD-YYYYMMDD returns all matches
 * in that window, filtered to knockout slugs by the adapter.
 * This avoids the per-group approach which relied on unstable group IDs.
 */
const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard" +
  "?limit=100&dates=20260627-20260720";

interface EspnScoreboardResponse {
  events?: EspnRawEvent[];
}

/**
 * GET /api/matches
 *
 * Fetches all knockout-round matches from the ESPN scoreboard API using a
 * date range. Returns normalized Match[] with dynamic Cache-Control.
 *
 * Falls back to mock-matches.ts when the ESPN request fails.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(ESPN_SCOREBOARD_URL);

    if (!response.ok) {
      throw new Error(`ESPN API responded ${response.status}`);
    }

    const data: EspnScoreboardResponse = await response.json();
    const events = data.events ?? [];

    const matches: Match[] = events
      .map((event) => normalizeEspnEvent(event))
      .filter((match): match is Match => match !== null);

    if (matches.length === 0) {
      throw new Error("ESPN returned 0 knockout matches");
    }

    const revalidate = getRevalidateSeconds(matches);

    const res = NextResponse.json({ matches, source: "espn" });
    res.headers.set(
      "Cache-Control",
      `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
    );
    return res;
  } catch (err) {
    console.error("[/api/matches] ESPN fetch failed, using mock fallback:", err);

    const res = NextResponse.json({ matches: mockMatches, source: "fallback" });
    res.headers.set("X-Data-Source", "fallback");
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=30");
    return res;
  }
}
