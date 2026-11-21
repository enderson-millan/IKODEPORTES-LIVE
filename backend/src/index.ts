import http from "node:http";
import cors from "cors";
import express from "express";
import { config } from "./config";
import { attachRealtime } from "./realtime/socket-server";
import { healthRouter } from "./routes/health";

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

const server = http.createServer(app);
const io = attachRealtime(server, config.corsOrigin);

server.listen(config.port, () => {
  console.log(
    JSON.stringify({
      level: "info",
      msg: "ikodeportes-api listening",
      port: config.port,
      corsOrigin: config.corsOrigin,
      feedPollIntervalMs: config.feedPollIntervalMs,
      databaseConfigured: Boolean(config.databaseUrl),
    }),
  );
});

function shutdown(signal: string): void {
  console.log(JSON.stringify({ level: "info", msg: "shutting down", signal }));

  io.close();
  server.close(() => process.exit(0));

  // Do not hang forever on a half-open connection.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
