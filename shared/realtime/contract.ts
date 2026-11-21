/**
 * Realtime contract shared by the API and every client.
 *
 * Rooms are derived from ids so both sides agree without extra configuration:
 * - `game:${gameId}`    -> canonical state updates (web app)
 * - `overlay:${gameId}` -> operator panel visibility + state (OBS overlay)
 */

import type {
  CanonicalBaseballState,
  OverlayControlState,
  OverlayPanelId,
} from "../types/baseball-state";

export const gameRoom = (gameId: string): string => `game:${gameId}`;

export const overlayRoom = (gameId: string): string => `overlay:${gameId}`;

/** Socket.IO event names. Keep them stable: clients pin them. */
export const SOCKET_EVENTS = {
  /** Client -> server: subscribe to a game room. */
  joinGame: "join-game",
  /** Client -> server: leave a game room. */
  leaveGame: "leave-game",
  /** Client -> server: subscribe to the overlay room of a game. */
  joinOverlay: "join-overlay",
  /** Client -> server: leave the overlay room. */
  leaveOverlay: "leave-overlay",
  /** Server -> client: full canonical snapshot. */
  state: "game-state",
  /** Server -> client: incremental play-by-play item. */
  play: "game-play",
  /** Server -> client: overlay control snapshot. */
  overlayState: "overlay-state",
} as const;

export interface JoinRoomPayload {
  gameId: string;
}

/** Server -> client payloads. */
export interface GameStatePayload {
  state: CanonicalBaseballState;
}

export interface OverlayStatePayload {
  control: OverlayControlState;
}

/** Client -> server payload: toggle one overlay panel. */
export interface OverlayTogglePayload {
  gameId: string;
  panel: OverlayPanelId;
  visible: boolean;
}
