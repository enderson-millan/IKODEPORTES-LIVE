import { Router } from "express";
import type { IBaseballFeedAdapter } from "../modules/feeds/types";
import type { PollingService } from "../modules/live/polling-service";

export interface LiveRouterOptions {
  adapter: IBaseballFeedAdapter;
  polling: PollingService;
  controlToken?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isValidGameId(value: string): boolean {
  return /^\d{4,12}$/.test(value);
}

/** Live tracking API: discovery, on-demand start/stop and current state. */
export function createLiveRouter({
  adapter,
  polling,
  controlToken,
}: LiveRouterOptions): Router {
  const router = Router();

  router.get("/api/live/discover", async (request, response) => {
    try {
      const date = typeof request.query.date === "string" ? request.query.date : undefined;
      const games = await adapter.listGames(date);
      response.json({ games });
    } catch (error) {
      response.status(502).json({ error: "feed-unavailable", message: errorMessage(error) });
    }
  });

  router.get("/api/live/games", (_request, response) => {
    response.json({ games: polling.list() });
  });

  router.get("/api/live/games/:gameId", (request, response) => {
    const state = polling.getState(request.params.gameId);
    if (!state) {
      response.status(404).json({ error: "not-tracked" });
      return;
    }
    response.json({ state });
  });

  /**
   * Idempotent and intentionally public: the overlay calls it when it opens
   * (OBS starts polling only while streaming). It can only start a real gameId.
   */
  router.post("/api/live/games/:gameId/start", async (request, response) => {
    const { gameId } = request.params;
    if (!isValidGameId(gameId)) {
      response.status(400).json({ error: "invalid-game-id" });
      return;
    }

    try {
      const state = await polling.start(gameId);
      response.json({ state });
    } catch (error) {
      response.status(502).json({ error: "feed-unavailable", message: errorMessage(error) });
    }
  });

  router.post("/api/live/games/:gameId/stop", (request, response) => {
    if (controlToken) {
      const authorization = request.header("authorization");
      if (authorization !== `Bearer ${controlToken}`) {
        response.status(401).json({ error: "unauthorized" });
        return;
      }
    }

    const stopped = polling.stop(request.params.gameId);
    if (!stopped) {
      response.status(404).json({ error: "not-tracked" });
      return;
    }
    response.status(204).end();
  });

  return router;
}
