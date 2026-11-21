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

/**
 * Socket.IO transport. It owns room membership only; feed polling and state
 * production land in the next phase. Keeping the contract here means clients
 * can be wired now and stay stable when the poller arrives.
 */
export function attachRealtime(httpServer: HttpServer, corsOrigin: string): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim()),
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.joinGame, (payload: JoinRoomPayload) => {
      if (payload && typeof payload.gameId === "string" && payload.gameId.length > 0) {
        void socket.join(gameRoom(payload.gameId));
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
      }
    });

    socket.on(SOCKET_EVENTS.leaveOverlay, (payload: JoinRoomPayload) => {
      if (payload && typeof payload.gameId === "string") {
        void socket.leave(overlayRoom(payload.gameId));
      }
    });

    // Placeholder: the overlay panel toggles will be persisted and echoed by the
    // overlay controller in the next phase. The event is accepted now so the
    // contract does not change later.
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
