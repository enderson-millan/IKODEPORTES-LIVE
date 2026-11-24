import {
  createEmptyLineScore,
  type CanonicalBaseballState,
} from "../../shared/types/baseball-state";
import type {
  FeedGameSummary,
  FeedPatch,
  FeedSnapshot,
  IBaseballFeedAdapter,
} from "../src/modules/feeds/types";
import { PollingService } from "../src/modules/live/polling-service";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[check-polling] ${message}`);
}

function makeState(gameId: string): CanonicalBaseballState {
  return {
    schemaVersion: 1,
    gameId,
    league: "LVBP",
    status: "LIVE",
    updatedAt: "2026-01-01T00:00:00.000Z",
    source: { adapter: "mlb-stats", fetchedAt: "2026-01-01T00:00:00.000Z" },
    matchup: {
      away: { id: "1", code: "AAA", name: "Away" },
      home: { id: "2", code: "BBB", name: "Home" },
    },
    score: { away: 0, home: 0 },
    lineScore: createEmptyLineScore(9),
    clock: { inning: 1, half: "TOP", isLive: true },
    bases: { first: false, second: false, third: false },
    count: { balls: 0, strikes: 0, outs: 0 },
    atBat: null,
    onDeck: [],
    defense: [],
    playByPlay: [],
  };
}

class StubAdapter implements IBaseballFeedAdapter {
  readonly id = "mlb-stats" as const;
  readonly league = "LVBP" as const;
  fetchCalls = 0;
  snapshotOnPatch = false;
  normalizeStatus: CanonicalBaseballState["status"] = "LIVE";
  patchGameId = "";

  async listGames(): Promise<FeedGameSummary[]> {
    return [];
  }

  async fetchState(gameId: string): Promise<FeedSnapshot> {
    this.fetchCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 40));
    return {
      state: makeState(gameId),
      raw: { gameId, metaData: { timeStamp: "20260101_000000" } },
      timeStamp: "20260101_000000",
    };
  }

  async fetchPatch(): Promise<FeedPatch | null> {
    if (!this.snapshotOnPatch) return null;
    return {
      timeStamp: "20260101_000100",
      operations: [],
      snapshot: { gameId: this.patchGameId },
    };
  }

  normalize(raw: unknown): FeedSnapshot {
    const gameId = (raw as { gameId: string }).gameId;
    const state = makeState(gameId);
    state.status = this.normalizeStatus;
    return { state, raw, timeStamp: "20260101_000100" };
  }
}

async function expectReject(fn: () => Promise<unknown>, expected: string): Promise<void> {
  try {
    await fn();
  } catch (error) {
    assert(
      error instanceof Error && error.message === expected,
      `unexpected error: ${String(error)}`,
    );
    return;
  }
  throw new Error(`[check-polling] expected rejection: ${expected}`);
}

async function main(): Promise<void> {
  const adapter = new StubAdapter();
  const service = new PollingService(adapter, {
    intervalMs: 60_000,
    onState: () => undefined,
    maxGames: 5,
  });

  // B1: two concurrent starts must share one bootstrap and one runtime.
  const [first, second] = await Promise.all([service.start("1111"), service.start("1111")]);
  assert(adapter.fetchCalls === 1, `duplicate bootstrap: ${adapter.fetchCalls}`);
  assert(service.list().length === 1, "duplicate runtime");
  assert(first.gameId === "1111" && second.gameId === "1111", "wrong state");

  // Stopping while bootstrapping must not create a timer afterwards.
  const pending = service.start("2222");
  assert(service.stop("2222"), "stop should accept a pending start");
  await pending;
  assert(service.list().length === 1, "pending start created a runtime after stop");

  // Capacity guard.
  for (const gameId of ["3333", "4444", "5555", "6666"]) {
    await service.start(gameId);
  }
  assert(service.list().length === 5, "capacity setup failed");
  await expectReject(() => service.start("7777"), "tracking-capacity-reached");

  service.stopAll();
  assert(service.list().length === 0, "stopAll left runtimes behind");

  // A snapshot response (game went final) must replace the live state.
  adapter.snapshotOnPatch = true;
  adapter.normalizeStatus = "FINAL";
  adapter.patchGameId = "8888";
  const snapshotService = new PollingService(adapter, {
    intervalMs: 20,
    onState: () => undefined,
    maxGames: 5,
  });
  await snapshotService.start("8888");
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert(snapshotService.getState("8888")?.status === "FINAL", "snapshot did not replace state");
  snapshotService.stopAll();

  console.log("[check-polling] OK");
}

main().catch((error) => {
  console.error("[check-polling] FAILED", error);
  process.exit(1);
});
