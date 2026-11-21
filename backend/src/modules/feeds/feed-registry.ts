import type { FeedAdapterId } from "../../../../shared/types/baseball-state";
import { MlbStatsAdapter, type MlbStatsAdapterOptions } from "./mlb-stats-adapter";
import type { IBaseballFeedAdapter } from "./types";

/**
 * Adapter factory. New feeds (HTTP/JSON, custom manual entry) register here
 * without touching the polling service or the UI.
 */
export function createFeedAdapter(
  id: FeedAdapterId,
  options: MlbStatsAdapterOptions = {},
): IBaseballFeedAdapter {
  switch (id) {
    case "mlb-stats":
      return new MlbStatsAdapter(options);
    default:
      throw new Error(`Feed adapter "${id}" is not implemented yet`);
  }
}
