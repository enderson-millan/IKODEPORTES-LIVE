import { isLeagueCode, type LeagueCode } from "../../shared/types/baseball-state";

/** Runtime configuration for the realtime API. */
export interface AppConfig {
  port: number;
  corsOrigin: string;
  feedPollIntervalMs: number;
  databaseUrl: string | undefined;
  league: LeagueCode;
  sportId: number;
  leagueId: number;
  autoDiscover: boolean;
  controlToken: string | undefined;
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

function readLeague(): LeagueCode {
  const raw = process.env.LEAGUE;
  return isLeagueCode(raw) ? raw : "LVBP";
}

export const config: AppConfig = {
  port: readPositiveInt("PORT", 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Feed polling cadence. The StatsAPI advertises ~10 s of freshness; 5 s is
  // safe for the overlay and the diff endpoint stays tiny when idle.
  feedPollIntervalMs: Math.min(
    Math.max(readPositiveInt("FEED_POLL_INTERVAL_MS", 5000), 1000),
    60_000,
  ),
  databaseUrl: process.env.DATABASE_URL,
  league: readLeague(),
  sportId: readPositiveInt("LVBP_SPORT_ID", 17),
  leagueId: readPositiveInt("LVBP_LEAGUE_ID", 135),
  autoDiscover: readBoolean("LIVE_AUTO_DISCOVER", false),
  controlToken: process.env.CONTROL_TOKEN || undefined,
};
