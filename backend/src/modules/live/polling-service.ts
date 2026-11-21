import { createHash } from "node:crypto";
import { applyPatch, type Operation } from "fast-json-patch";
import type { CanonicalBaseballState, GameHalf, GameStatus, LeagueCode } from "../../../../shared/types/baseball-state";
import type { FeedGameSummary, IBaseballFeedAdapter } from "../feeds/types";

interface Runtime {
  gameId: string;
  raw: unknown;
  state: CanonicalBaseballState;
  timeStamp: string;
  hash: string;
  timer: NodeJS.Timeout | null;
  inFlight: boolean;
  errorCount: number;
  lastError: string | null;
  startedAt: number;
  updatedAt: number;
}

export interface RuntimeSummary {
  gameId: string;
  league: LeagueCode;
  status: GameStatus;
  inning: number;
  half: GameHalf;
  away: { code: string; name: string; score: number };
  home: { code: string; name: string; score: number };
  updatedAt: string;
  errorCount: number;
  lastError: string | null;
}

export interface PollingServiceOptions {
  intervalMs: number;
  onState: (state: CanonicalBaseballState) => void;
  logger?: (event: Record<string, unknown>) => void;
}

function hashRaw(raw: unknown): string {
  return createHash("sha256").update(JSON.stringify(raw)).digest("hex");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Keeps one in-memory snapshot per game and updates it with `diffPatch`.
 *
 * Bootstrap = full feed. Every tick = tiny diff (2 bytes when idle). Only
 * changed states are broadcast. On a patch failure the game is re-bootstrapped
 * once, which makes the loop self-healing without hammering the upstream.
 */
export class PollingService {
  private readonly runtimes = new Map<string, Runtime>();

  constructor(
    private readonly adapter: IBaseballFeedAdapter,
    private readonly options: PollingServiceOptions,
  ) {}

  getState(gameId: string): CanonicalBaseballState | undefined {
    return this.runtimes.get(gameId)?.state;
  }

  isRunning(gameId: string): boolean {
    return this.runtimes.has(gameId);
  }

  list(): RuntimeSummary[] {
    return Array.from(this.runtimes.values()).map((runtime) => ({
      gameId: runtime.gameId,
      league: runtime.state.league,
      status: runtime.state.status,
      inning: runtime.state.clock.inning,
      half: runtime.state.clock.half,
      away: {
        code: runtime.state.matchup.away.code,
        name: runtime.state.matchup.away.name,
        score: runtime.state.score.away,
      },
      home: {
        code: runtime.state.matchup.home.code,
        name: runtime.state.matchup.home.name,
        score: runtime.state.score.home,
      },
      updatedAt: new Date(runtime.updatedAt).toISOString(),
      errorCount: runtime.errorCount,
      lastError: runtime.lastError,
    }));
  }

  async start(gameId: string): Promise<CanonicalBaseballState> {
    const existing = this.runtimes.get(gameId);
    if (existing) return existing.state;

    const snapshot = await this.adapter.fetchState(gameId);
    const runtime: Runtime = {
      gameId,
      raw: snapshot.raw,
      state: snapshot.state,
      timeStamp: snapshot.timeStamp,
      hash: hashRaw(snapshot.raw),
      timer: null,
      inFlight: false,
      errorCount: 0,
      lastError: null,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    runtime.timer = setInterval(() => {
      void this.tick(gameId);
    }, this.options.intervalMs);
    runtime.timer.unref?.();

    this.runtimes.set(gameId, runtime);
    this.emit(runtime);
    this.log({
      event: "polling-started",
      gameId,
      status: runtime.state.status,
      intervalMs: this.options.intervalMs,
      timeStamp: runtime.timeStamp,
    });

    return runtime.state;
  }

  stop(gameId: string): boolean {
    const runtime = this.runtimes.get(gameId);
    if (!runtime) return false;
    if (runtime.timer) clearInterval(runtime.timer);
    this.runtimes.delete(gameId);
    this.log({ event: "polling-stopped", gameId });
    return true;
  }

  stopAll(): void {
    for (const gameId of Array.from(this.runtimes.keys())) {
      this.stop(gameId);
    }
  }

  async discoverToday(): Promise<FeedGameSummary[]> {
    return this.adapter.listGames();
  }

  /** Starts polling every game currently marked LIVE in today's schedule. */
  async startLiveGames(): Promise<string[]> {
    const games = await this.adapter.listGames();
    const started: string[] = [];

    for (const game of games) {
      if (game.status !== "LIVE" || !game.gameId) continue;
      try {
        await this.start(game.gameId);
        started.push(game.gameId);
      } catch (error) {
        this.log({
          event: "polling-start-failed",
          gameId: game.gameId,
          error: errorMessage(error),
        });
      }
    }

    return started;
  }

  private async tick(gameId: string): Promise<void> {
    const runtime = this.runtimes.get(gameId);
    if (!runtime || runtime.inFlight) return;

    runtime.inFlight = true;
    try {
      const patch = await this.adapter.fetchPatch(gameId, runtime.timeStamp);
      if (!patch) {
        runtime.errorCount = 0;
        runtime.lastError = null;
        return;
      }

      const result = applyPatch(runtime.raw, patch.operations as Operation[], false, true);
      runtime.raw = result.newDocument;

      const snapshot = this.adapter.normalize(runtime.raw);
      runtime.state = snapshot.state;
      runtime.timeStamp = snapshot.timeStamp || runtime.timeStamp;
      runtime.updatedAt = Date.now();
      runtime.errorCount = 0;
      runtime.lastError = null;

      const hash = hashRaw(snapshot.raw);
      if (hash !== runtime.hash) {
        runtime.hash = hash;
        this.emit(runtime);
        this.log({
          event: "state-changed",
          gameId,
          timeStamp: runtime.timeStamp,
          hash: hash.slice(0, 12),
          inning: snapshot.state.clock.inning,
          status: snapshot.state.status,
        });
      }
    } catch (error) {
      runtime.errorCount += 1;
      runtime.lastError = errorMessage(error);
      this.log({
        event: "poll-error",
        gameId,
        errorCount: runtime.errorCount,
        error: runtime.lastError,
      });

      // First failure is often a transient patch gap; resync on the second.
      if (runtime.errorCount >= 2) {
        await this.resync(runtime);
      }
    } finally {
      runtime.inFlight = false;
    }
  }

  private async resync(runtime: Runtime): Promise<void> {
    try {
      const snapshot = await this.adapter.fetchState(runtime.gameId);
      runtime.raw = snapshot.raw;
      runtime.state = snapshot.state;
      runtime.timeStamp = snapshot.timeStamp;
      runtime.hash = hashRaw(snapshot.raw);
      runtime.updatedAt = Date.now();
      runtime.errorCount = 0;
      runtime.lastError = null;
      this.emit(runtime);
      this.log({ event: "state-resynced", gameId: runtime.gameId });
    } catch (error) {
      this.log({
        event: "resync-failed",
        gameId: runtime.gameId,
        error: errorMessage(error),
      });
    }
  }

  private emit(runtime: Runtime): void {
    this.options.onState(runtime.state);
  }

  private log(event: Record<string, unknown>): void {
    this.options.logger?.(event);
  }
}
