import type { GameStatus, PitchDetail } from "@shared/types/baseball-state";

/** Picks readable text color for a team color badge. */
export function contrastText(hex?: string): string {
  if (!hex) return "#FFFFFF";
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "#FFFFFF";
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "#070D1A" : "#FFFFFF";
}

/** `.288` style batting average. */
export function formatAverage(average?: number | string): string {
  if (average === undefined || average === null) return "—";
  if (typeof average === "string") return average;
  return average.toFixed(3).replace(/^0/, "");
}

/** Two-decimal ERA. */
export function formatEra(era?: number): string {
  return era === undefined || era === null ? "—" : era.toFixed(2);
}

/** Velocity label, preferring the unit the feed reported. */
export function formatPitchSpeed(pitch: PitchDetail): string {
  if (pitch.speedMph !== undefined && pitch.speedMph !== null) {
    return `${Math.round(pitch.speedMph)} MPH`;
  }
  if (pitch.speedKmh !== undefined && pitch.speedKmh !== null) {
    return `${Math.round(pitch.speedKmh)} KM/H`;
  }
  return "—";
}

type DictKey =
  "statusLive" | "statusScheduled" | "statusFinal" | "statusPostponed" | "statusCanceled";

export const STATUS_LABEL_KEY: Record<GameStatus, DictKey> = {
  LIVE: "statusLive",
  SCHEDULED: "statusScheduled",
  FINAL: "statusFinal",
  POSTPONED: "statusPostponed",
  CANCELED: "statusCanceled",
};
