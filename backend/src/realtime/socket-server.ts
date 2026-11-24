import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import type {
  CanonicalBaseballState,
  OverlayControlState,
} from "../../../shared/types/baseball-state";
import {
  SOCKET_EVENTS,
  gameRoom,
  overlayRoom,
  type JoinRoomPayload,
  type OverlayTogglePayload,
} from "../../../shared/realtime/contract";

export interface RealtimeStateSource {
  getState(gameId: string): CanonicalBaseballState | undefined;
}

/**
 * Socket.IO transport. It owns room membership and pushes the current snapshot
 * to a client as soon as it joins, so an OBS source paints immediately instead
 * of waiting for the next polling tick.
 */
export function attachRealtime(
  httpServer: HttpServer,
  corsOrigin: string,
  source: RealtimeStateSource,
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim()),
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  const sendCurrentState = (socketId: string, gameId: string): void => {
    const state = source.getState(gameId);
    if (state) {
      io.to(socketId).emit(SOCKET_EVENTS.state, { state });
    }
  };

  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.joinGame, (payload: JoinRoomPayload) => {
      if (payload && typeof payload.gameId === "string" && payload.gameId.length > 0) {
        void socket.join(gameRoom(payload.gameId));
        sendCurrentState(socket.id, payload.gameId);
      }
    });

    socket.on(SOCKET_EVENTS.leaveGame, (payload: JoinRoomPayload) => {
      if (payload && typeof payload.gameId === "string") {
        void socket.leave(gameRoom(payload.gameId));
      }
    });

    socket.on(SOCKET_EVENTS.joinOverlay, (payload: JoinRoomPayload) => {
      if (payload && typeof payload.gameId === "string" && payload.gameId.length > 0) {
        void socket.join(overlayRoom(payload.gameId));
        void socket.join(gameRoom(payload.gameId));
        sendCurrentState(socket.id, payload.gameId);
      }
    });

    socket.on(SOCKET_EVENTS.leaveOverlay, (payload: JoinRoomPayload) => {
      if (payload && typeof payload.gameId === "string") {
        void socket.leave(overlayRoom(payload.gameId));
      }
    });

    // Placeholder: overlay panel toggles are persisted and echoed in the next
    // phase. The event is accepted now so the contract does not change later.
    socket.on("overlay-toggle", (_payload: OverlayTogglePayload) => {
      // no-op until the overlay controller is implemented
    });
  });

  return io;
}

export function broadcastGameState(io: SocketIOServer, state: CanonicalBaseballState): void {
  io.to(gameRoom(state.gameId)).emit(SOCKET_EVENTS.state, { state });
}

export function broadcastOverlayState(
  io: SocketIOServer,
  gameId: string,
  control: OverlayControlState,
): void {
  io.to(overlayRoom(gameId)).emit(SOCKET_EVENTS.overlayState, { control });
}
