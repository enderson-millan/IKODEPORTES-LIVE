import { Router } from "express";
import { LEAGUE_CODES, OVERLAY_PANEL_IDS } from "../../../shared/types/baseball-state";

export const healthRouter = Router();

/** Liveness/readiness probe used by Docker and Dokploy. */
healthRouter.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "ikodeportes-api",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    leagues: LEAGUE_CODES,
    overlayPanels: OVERLAY_PANEL_IDS,
  });
});
