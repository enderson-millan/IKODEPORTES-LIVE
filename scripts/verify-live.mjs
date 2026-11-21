/**
 * End-to-end check for the live API: on-demand start, direct state, and the
 * Socket.IO snapshot an OBS source receives when it joins a game room.
 *
 * Usage:
 *   node scripts/verify-live.mjs [gameId]
 *
 * Requires the API running on LIVE_API_URL (default http://127.0.0.1:4000).
 */
import { io } from "socket.io-client";

const base = (process.env.LIVE_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
const gameId = process.argv[2] ?? "869962";

function assert(condition, message) {
  if (!condition) throw new Error(`[verify-live] ${message}`);
}

async function main() {
  const health = await fetch(`${base}/health`);
  assert(health.ok, `health returned ${health.status}`);

  const start = await fetch(`${base}/api/live/games/${gameId}/start`, { method: "POST" });
  const startBody = await start.json().catch(() => ({}));
  assert(start.ok, `start returned ${start.status}: ${JSON.stringify(startBody)}`);
  const startedState = startBody.state;
  assert(startedState?.gameId === gameId, "start did not return the requested game");

  const direct = await fetch(`${base}/api/live/games/${gameId}`);
  const directBody = await direct.json();
  assert(direct.ok, `state returned ${direct.status}`);
  assert(directBody.state?.gameId === gameId, "direct state mismatch");

  const socketState = await new Promise((resolve, reject) => {
    const socket = io(base, { transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("timeout waiting for game-state"));
    }, 10_000);

    socket.on("connect", () => socket.emit("join-game", { gameId }));
    socket.on("game-state", (payload) => {
      clearTimeout(timer);
      socket.close();
      resolve(payload.state);
    });
    socket.on("connect_error", (error) => {
      clearTimeout(timer);
      socket.close();
      reject(error);
    });
  });

  assert(socketState?.gameId === gameId, "socket state mismatch");
  assert(Array.isArray(socketState.defense), "socket state has no defense array");

  console.log(
    JSON.stringify(
      {
        api: base,
        gameId,
        status: startedState.status,
        score: startedState.score,
        clock: startedState.clock,
        count: startedState.count,
        bases: startedState.bases,
        defense: socketState.defense.length,
        plays: socketState.playByPlay.length,
        socket: "received",
      },
      null,
      2,
    ),
  );

  await fetch(`${base}/api/live/games/${gameId}/stop`, { method: "POST" });
  console.log("[verify-live] OK");
}

main().catch((error) => {
  console.error("[verify-live] FAILED", error);
  process.exit(1);
});
