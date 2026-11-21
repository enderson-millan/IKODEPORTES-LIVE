import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  type Match,
  type MatchDecision,
  type Stage,
  type Status,
  type Team,
  ESPN_SLUG_MAP,
} from "@/lib/types";

dayjs.extend(utc);

// ─── ESPN Raw Types ───────────────────────────────────────────────────────────

export interface EspnRawCompetitor {
  id: string;
  order: number;
  score: string;
  winner: boolean;
  advance: boolean;
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
}

export interface EspnRawEvent {
  id: string;
  date: string;
  season: { slug: string };
  competitions: Array<{
    status: {
      type: { state: "pre" | "in" | "post"; name: string; description?: string };
      displayClock: string;
    };
    competitors: EspnRawCompetitor[];
    venue?: { displayName: string };
  }>;
}

// ─── State → Status mapping ───────────────────────────────────────────────────

const STATE_TO_STATUS: Record<"pre" | "in" | "post", Status> = {
  pre: "UPCOMING",
  in: "LIVE",
  post: "FINISHED",
};

// ─── ESPN status description → MatchDecision ─────────────────────────────────
//
// Known values from ESPN soccer scoreboard (mata-mata / knockout):
//   "Final"              → FT  (decided in 90 min)
//   "Final/AET"          → AET (decided in extra time — 120 min, still tied at 90)
//   "Final - AET"        → AET (alternate format seen in some leagues)
//   "Final/Penalties"    → PEN (decided on penalties — score = score at 90+120 min)
//   "Final - Penalties"  → PEN (alternate format)
//
// Score stored by ESPN is always the score at end of normal+extra time,
// NOT the penalty shootout score. This means a 1-1 PEN match shows score 1-1.
// For the MataMata.live scoring rules (Opção A), we use this score directly:
// picking the correct winner + correct score (1-1) in a PEN match is still
// worth +30 pts, consistent with what users can predict.

function parseDecision(description: string | undefined): MatchDecision | undefined {
  if (!description) return undefined;
  const d = description.toLowerCase();
  if (d.includes("penalt")) return "PEN";
  if (d.includes("aet") || d.includes("extra")) return "AET";
  if (d.includes("final")) return "FT";
  return undefined;
}

// ─── normalizeEspnEvent ───────────────────────────────────────────────────────

/**
 * Converts a raw ESPN scoreboard event into the canonical Match type.
 * Returns null if the event belongs to an unmapped stage (e.g. group stage).
 */
export function normalizeEspnEvent(event: EspnRawEvent): Match | null {
  // Guard: competitions array must be non-empty
  if (!event.competitions || event.competitions.length === 0) {
    return null;
  }

  const competition = event.competitions[0];

  // Map season slug → Stage; return null for unmapped slugs (group stage, etc.)
  const stage: Stage | undefined = ESPN_SLUG_MAP[event.season.slug];
  if (!stage) {
    return null;
  }

  // Map ESPN state → Status
  const state = competition.status.type.state;
  const status: Status = STATE_TO_STATUS[state];

  const competitors = competition.competitors ?? [];

  // Extract teamA (order === 0) and teamB (order === 1) defensively
  const competitorA = competitors.find((c) => c.order === 0);
  const competitorB = competitors.find((c) => c.order === 1);

  if (!competitorA || !competitorB) {
    return null;
  }

  const buildTeam = (competitor: EspnRawCompetitor): Team => {
    const parsedScore = parseInt(competitor.score, 10);
    const score = status !== "UPCOMING" && !isNaN(parsedScore) ? parsedScore : undefined;

    // ESPN returns placeholder abbreviations (e.g. "RD32", "RD16 W1", "QFW1")
    // for matches where the teams are not yet determined. These always have an
    // empty logo string. Normalize them to a consistent "TBD" abbreviation and
    // empty logo so the UI can render a placeholder safely.
    const logo = competitor.team.logo?.trim() ?? "";
    const abbr = logo === "" ? "TBD" : competitor.team.abbreviation;
    const name = logo === "" ? "A definir" : competitor.team.displayName;

    return {
      id: competitor.team.id,
      name,
      abbr,
      logo,
      score,
    };
  };

  const teamA = buildTeam(competitorA);
  const teamB = buildTeam(competitorB);

  // winnerId: only set when FINISHED and a competitor has winner === true
  let winnerId: string | undefined;
  if (status === "FINISHED") {
    const winnerCompetitor = competitors.find((c) => c.winner === true);
    if (winnerCompetitor) {
      winnerId = winnerCompetitor.team.id;
    }
  }

  // displayClock: only relevant when LIVE
  const displayClock = status === "LIVE" ? competition.status.displayClock : undefined;

  // decision: how the match was decided — only meaningful when FINISHED
  const decision =
    status === "FINISHED" ? parseDecision(competition.status.type.description) : undefined;

  return {
    id: event.id,
    stage,
    status,
    kickoff: event.date,
    displayClock,
    teamA,
    teamB,
    winnerId,
    venue: competition.venue?.displayName,
    decision,
  };
}

// ─── getRevalidateSeconds ─────────────────────────────────────────────────────

/**
 * Returns the ISR revalidation interval in seconds based on match states:
 * - 30s  if any match is LIVE
 * - 120s if any match is UPCOMING and kicks off today (UTC)
 * - 300s otherwise
 */
export function getRevalidateSeconds(matches: Match[]): number {
  const hasLive = matches.some((m) => m.status === "LIVE");
  if (hasLive) return 30;

  const todayUtc = dayjs.utc().format("YYYY-MM-DD");
  const hasUpcomingToday = matches.some(
    (m) => m.status === "UPCOMING" && dayjs.utc(m.kickoff).format("YYYY-MM-DD") === todayUtc,
  );
  if (hasUpcomingToday) return 120;

  return 300;
}
