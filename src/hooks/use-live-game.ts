"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import type { CanonicalBaseballState } from "@shared/types/baseball-state";
import { SOCKET_EVENTS } from "@shared/realtime/contract";

export type LiveConnection = "connecting" | "live" | "offline";

interface UseLiveGameOptions {
  /** API origin, e.g. https://api.live.ikodeportes.com (no trailing slash). */
  wsUrl: string;
  /** State used before the API answers (demo fixture or last known state). */
  fallback?: CanonicalBaseballState | null;
}

/**
 * Subscribes to a game room and seeds the first frame over HTTP. The POST to
 * `/start` is idempotent: opening the overlay is what turns polling on.
 */
export function useLiveGame(
  gameId: string,
  { wsUrl, fallback = null }: UseLiveGameOptions,
): { state: CanonicalBaseballState | null; connection: LiveConnection } {
  const [state, setState] = useState<CanonicalBaseballState | null>(fallback);
  const [connection, setConnection] = useState<LiveConnection>("connecting");

  useEffect(() => {
    setState(fallback);
  }, [fallback]);

  useEffect(() => {
    if (!gameId) return;

    if (gameId === "demo-live") {
      setConnection("live");
      return;
    }

    let cancelled = false;
    const base = wsUrl.replace(/\/$/, "");

    fetch(`${base}/api/live/games/${gameId}/start`, { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { state?: CanonicalBaseballState } | null) => {
        if (!cancelled && payload?.state) {
          setState(payload.state);
        }
      })
      .catch(() => {
        // API offline: the socket retry loop takes over.
      });

    const socket = io(base, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      setConnection("live");
      socket.emit(SOCKET_EVENTS.joinGame, { gameId });
    });

    socket.on(SOCKET_EVENTS.state, (payload: { state?: CanonicalBaseballState }) => {
      if (payload?.state) {
        setState(payload.state);
      }
    });

    socket.on("disconnect", () => setConnection("offline"));
    socket.on("connect_error", () => setConnection("offline"));

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [gameId, wsUrl, fallback]);

  return { state, connection };
}
