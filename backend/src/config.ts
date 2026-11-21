/** Runtime configuration for the realtime API. */
export interface AppConfig {
  port: number;
  corsOrigin: string;
  feedPollIntervalMs: number;
  databaseUrl: string | undefined;
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config: AppConfig = {
  port: readPositiveInt("PORT", 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Feed polling cadence. Clamped to a safe range to protect upstream APIs.
  feedPollIntervalMs: Math.min(
    Math.max(readPositiveInt("FEED_POLL_INTERVAL_MS", 3000), 1000),
    60_000,
  ),
  databaseUrl: process.env.DATABASE_URL,
};
