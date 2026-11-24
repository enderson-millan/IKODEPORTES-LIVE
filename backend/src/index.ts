import http from "node:http";
import cors from "cors";
import express from "express";
import { config } from "./config";
import { createFeedAdapter } from "./modules/feeds/feed-registry";
import { PollingService } from "./modules/live/polling-service";
import { attachRealtime, broadcastGameState } from "./realtime/socket-server";
import { healthRouter } from "./routes/health";
import { createLiveRouter } from "./routes/live";

function log(event: Record<string, unknown>): void {
  console.log(JSON.stringify({ level: "info", ...event }));
}

const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin:
      config.corsOrigin === "*"
        ? true
        : config.corsOrigin.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json({ limit: "256kb" }));
app.use(healthRouter);

const adapter = createFeedAdapter("mlb-stats", {
  league: config.league,
  sportId: config.sportId,
  leagueId: config.leagueId,
});

let polling: PollingService | null = null;

const server = http.createServer(app);
const io = attachRealtime(server, config.corsOrigin, {
  getState: (gameId) => polling?.getState(gameId),
});

const pollingService = new PollingService(adapter, {
  intervalMs: config.feedPollIntervalMs,
  onState: (state) => broadcastGameState(io, state),
  logger: log,
  maxGames: config.maxTrackedGames,
});
polling = pollingService;

app.use(
  createLiveRouter({
    adapter,
    polling: pollingService,
    controlToken: config.controlToken,
  }),
);

server.listen(config.port, () => {
  log({
    msg: "ikodeportes-api listening",
    port: config.port,
    corsOrigin: config.corsOrigin,
    feedPollIntervalMs: config.feedPollIntervalMs,
    league: config.league,
    autoDiscover: config.autoDiscover,
    databaseConfigured: Boolean(config.databaseUrl),
  });

  if (config.autoDiscover) {
    void pollingService
      .startLiveGames()
      .then((gameIds) => log({ msg: "auto-discover", started: gameIds }))
      .catch((error) =>
        log({
          msg: "auto-discover-failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
  }
});

function shutdown(signal: string): void {
  log({ msg: "shutting down", signal });

  pollingService.stopAll();
  io.close();
  server.close(() => process.exit(0));

  // Do not hang forever on a half-open connection.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
