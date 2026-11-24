import type {
  CanonicalBaseballState,
  FeedAdapterId,
  GameSummary,
  LeagueCode,
} from "../../../../shared/types/baseball-state";

/** A game discovered by an adapter before it is tracked. */
export type FeedGameSummary = GameSummary;

/** RFC 6902 operation, as returned by the StatsAPI diff endpoint. */
export interface JsonPatchOperation {
  op: string;
  path: string;
  value?: unknown;
  from?: string;
}

/** Raw feed snapshot + its normalized canonical form. */
export interface FeedSnapshot {
  state: CanonicalBaseballState;
  raw: unknown;
  /** Provider timestamp used as the diff cursor and dedupe key. */
  timeStamp: string;
}

export interface FeedPatch {
  timeStamp: string;
  operations: JsonPatchOperation[];
  /**
   * Some feeds answer a diff request with a full snapshot instead of patches
   * (StatsAPI does this when a game goes final / `fullUpdate`). When present,
   * consumers replace their raw snapshot with this payload.
   */
  snapshot?: unknown;
}

/**
 * One feed integration. Adapters are stateless: callers own the raw snapshot
 * and pass it back for patching, so a process restart only needs a bootstrap.
 */
export interface IBaseballFeedAdapter {
  readonly id: FeedAdapterId;
  readonly league: LeagueCode;
  listGames(date?: string): Promise<FeedGameSummary[]>;
  fetchState(gameId: string): Promise<FeedSnapshot>;
  fetchPatch(gameId: string, fromTimeStamp: string): Promise<FeedPatch | null>;
  /** Normalizes a raw provider payload (fresh or patched) into the contract. */
  normalize(raw: unknown): FeedSnapshot;
}
