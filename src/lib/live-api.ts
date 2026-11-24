import type { CanonicalBaseballState, GameSummary } from "@shared/types/baseball-state";

/**
 * Server-only API helpers. Do not import this module from a client component:
 * the browser must use the `wsUrl` prop (public origin) instead.
 */
export function getLiveApiUrl(): string {
  return (
    process.env.LIVE_API_INTERNAL_URL ||
    process.env.LIVE_WS_URL ||
    process.env.NEXT_PUBLIC_WS_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Today's games (or a specific date) from the API discovery endpoint. */
export async function fetchGameSummaries(date?: string): Promise<GameSummary[]> {
  const base = getLiveApiUrl();
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`${base}/api/live/discover${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`[live-api] discover ${response.status}`);
  }

  const payload = await parseJson<{ games?: GameSummary[] }>(response);
  return payload?.games ?? [];
}

/**
 * Current state of a game. If it is not being tracked yet, starts polling and
 * reads it again, so a direct URL works without opening the overlay first.
 */
export async function fetchGameState(gameId: string): Promise<CanonicalBaseballState | null> {
  try {
    const base = getLiveApiUrl();

    const read = async (): Promise<Response> =>
      fetch(`${base}/api/live/games/${encodeURIComponent(gameId)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });

    let response = await read();

    if (response.status === 404) {
      const start = await fetch(`${base}/api/live/games/${encodeURIComponent(gameId)}/start`, {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      if (!start.ok) return null;
      const started = await parseJson<{ state?: CanonicalBaseballState }>(start);
      if (started?.state) return started.state;
      response = await read();
    }

    if (!response.ok) return null;

    const payload = await parseJson<{ state?: CanonicalBaseballState }>(response);
    return payload?.state ?? null;
  } catch {
    return null;
  }
}
