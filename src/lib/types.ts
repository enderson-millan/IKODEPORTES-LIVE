/**
 * Canonical types and constants for MataMata.live
 * All domain types used across the application are defined here.
 */

// ─── Union Types ─────────────────────────────────────────────────────────────

export type Stage = "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type Status = "LIVE" | "UPCOMING" | "FINISHED";

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface Team {
  id: string; // ESPN team ID (e.g. "478")
  name: string; // Full name (e.g. "France")
  abbr: string; // Abbreviation (e.g. "FRA")
  logo: string; // URL (e.g. "https://a.espncdn.com/i/teamlogos/countries/500/fra.png")
  score?: number;
}

/**
 * How a finished match was decided.
 * - "FT"  → decided in 90 min (regular time)
 * - "AET" → decided in extra time (score reflects 120 min)
 * - "PEN" → decided on penalties (score reflects 90+120 min, i.e. still tied)
 */
export type MatchDecision = "FT" | "AET" | "PEN";

export interface Match {
  id: string; // ESPN event ID (e.g. "760492")
  stage: Stage;
  status: Status;
  kickoff: string; // ISO 8601 (e.g. "2026-06-20T16:00:00Z")
  displayClock?: string; // e.g. "74'" or "FT" when match is active
  teamA: Team; // home (order: 0)
  teamB: Team; // away (order: 1)
  winnerId?: string; // ESPN team ID of the winner
  venue?: string; // e.g. "MetLife Stadium"
  decision?: MatchDecision; // how the match was decided (only set when FINISHED)
}

/**
 * Stores the user's pick for a single match.
 * scoreA/scoreB are optional — users may pick only the winner without a score.
 */
export interface Pick {
  teamId: string;
  scoreA?: number; // predicted goals for teamA
  scoreB?: number; // predicted goals for teamB
}

export interface RankRow {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  avatarFallback: string; // initials for AvatarFallback (e.g. "LP")
  points: number;
  hits: number; // winner-only correct picks
  exactHits: number; // exact score correct picks
  trend: "up" | "down" | "flat";
  isMe?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Ordered list of knockout stages from earliest to latest */
export const stageOrder: Stage[] = ["r32", "r16", "qf", "sf", "third", "final"];

/** Maps ESPN calendar value → internal Stage */
export const ESPN_STAGE_MAP: Record<string, Stage> = {
  "2": "r32",
  "3": "r16",
  "4": "qf",
  "5": "sf",
  "6": "third",
  "7": "final",
};

/** Maps ESPN season.slug → internal Stage */
export const ESPN_SLUG_MAP: Record<string, Stage> = {
  "round-of-32": "r32",
  "round-of-16": "r16",
  quarterfinals: "qf",
  semifinals: "sf",
  "third-place-match": "third",
  "3rd-place-match": "third", // alternate slug used by ESPN API
  final: "final",
};
