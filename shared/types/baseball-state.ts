/**
 * Canonical baseball / softball game state.
 *
 * This is the single contract shared by:
 * - the feed adapters (MLB StatsAPI, HTTP/JSON, manual custom feed)
 * - the realtime backend (Express + Socket.IO)
 * - the web app (`/games/[gameId]`) and the OBS overlay (`/overlay/[gameId]`)
 *
 * It is discipline-agnostic: nothing here assumes a league, a country or a
 * specific feed vendor. Adapters normalize their own payloads into this shape
 * and the UI only ever reads this shape.
 *
 * Adaptation is one-way and lossless at the contract level: when a feed does
 * not provide a field, the field stays `null` or `undefined` instead of being
 * invented. Consumers must render a neutral placeholder for missing data.
 */

/** Leagues/competitions the platform can track. `CUSTOM` is the escape hatch. */
export const LEAGUE_CODES = ["LVBP", "MLB", "LIDOM", "LMP", "WBC", "SOFTBALL", "CUSTOM"] as const;

export type LeagueCode = (typeof LEAGUE_CODES)[number];

/** Lifecycle of a game, independent of the feed vendor's wording. */
export const GAME_STATUSES = ["SCHEDULED", "LIVE", "FINAL", "POSTPONED", "CANCELED"] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

/** Half of an inning. `TOP` is the away team batting, `BOTTOM` the home team. */
export type GameHalf = "TOP" | "BOTTOM";

/** Which feed implementation produced a state snapshot. */
export const FEED_ADAPTER_IDS = ["demo", "mlb-stats", "http-json", "custom"] as const;

export type FeedAdapterId = (typeof FEED_ADAPTER_IDS)[number];

/** A team is always identified by a short 3-letter text code (no logos required). */
export interface TeamIdentity {
  /** Stable id inside the feed/league. */
  id: string;
  /** 3-letter uppercase code, e.g. "TIT". */
  code: string;
  /** Full display name, e.g. "Titanes de Oriente". */
  name: string;
  /** Compact name for tight layouts, e.g. "Titanes". */
  shortName?: string;
  /** Optional avatar/logo URL. Never required: fall back to the code. */
  logoUrl?: string;
  /** Optional brand color, hex. Used for accents only. */
  primaryColor?: string;
  /** Optional secondary brand color, hex. */
  secondaryColor?: string;
}

export interface GameVenue {
  name: string;
  city?: string;
  country?: string;
}

/** Lightweight row returned by discovery/list endpoints. */
export interface GameSummary {
  gameId: string;
  league: LeagueCode;
  status: GameStatus;
  away: TeamIdentity;
  home: TeamIdentity;
  awayScore: number;
  homeScore: number;
  scheduledStart?: string;
  inning?: number;
  half?: GameHalf;
  venue?: string;
}

/** A runner occupying a base, when the feed exposes their identity. */
export interface BaseRunner {
  id?: string;
  name: string;
  /** Jersey number, when available. */
  jerseyNumber?: string;
}

/**
 * Base occupancy. `true` means a runner is on that base. The optional
 * `*Runner` fields carry identity for the field visual; they never replace the
 * booleans, so existing consumers stay valid.
 */
export interface BasesState {
  first: boolean;
  second: boolean;
  third: boolean;
  firstRunner?: BaseRunner;
  secondRunner?: BaseRunner;
  thirdRunner?: BaseRunner;
}

/** The three live counters shown as `B-S-O`. */
export interface CountState {
  balls: number;
  strikes: number;
  outs: number;
}

/** Inning-by-inning runs for a single team. `null` = not played yet. */
export interface LineScoreInning {
  inning: number;
  runs: number | null;
}

/** One team row of the box score, including the `R / H / E` totals. */
export interface TeamLineScore {
  innings: LineScoreInning[];
  runs: number;
  hits: number;
  errors: number;
}

/** Both team rows. `away` bats in the top half, `home` in the bottom half. */
export interface LineScore {
  away: TeamLineScore;
  home: TeamLineScore;
}

/** Where the game clock stands right now. */
export interface GameClock {
  /** 1-based inning number. */
  inning: number;
  half: GameHalf;
  /** Convenience flag: `status === "LIVE"`. */
  isLive: boolean;
}

/** Pitch outcome vocabulary shared by every adapter. */
export const PITCH_RESULTS = [
  "BALL",
  "CALLED_STRIKE",
  "SWINGING_STRIKE",
  "FOUL",
  "IN_PLAY",
  "HIT_BY_PITCH",
  "OTHER",
] as const;

export type PitchResult = (typeof PITCH_RESULTS)[number];

/** One pitch inside the current at-bat. */
export interface PitchDetail {
  /** 1-based order inside the current at-bat. */
  sequence: number;
  /** Feed-specific pitch type: "4-Seam", "Slider", "Sinker", "Changeup", ... */
  type: string;
  /** Velocity in miles per hour, when the feed reports it. */
  speedMph?: number;
  /** Velocity in kilometers per hour, when the feed reports it. */
  speedKmh?: number;
  result: PitchResult;
  /** Optional human-readable pitch description. */
  description?: string;
}

/** Batter summary for the live duel / on-deck strip. */
export interface BatterSummary {
  id?: string;
  name: string;
  /** Batting side: left, right or switch. */
  bats?: "L" | "R" | "S";
  /** Batting average as a number (`0.288`) or preformatted string (`".288"`). */
  average?: number | string;
  homeRuns?: number;
  rbi?: number;
  /** Line on the day, e.g. "2-3, RBI". */
  todayLine?: string;
}

/** Pitcher summary for the live duel. */
export interface PitcherSummary {
  id?: string;
  name: string;
  throws?: "L" | "R";
  /** Record on the season, e.g. "8-4". */
  record?: string;
  /** Earned run average, e.g. 4.95. */
  era?: number;
  /** Pitch count on the day. */
  pitchCount?: number;
}

/** The batter-vs-pitcher duel currently in progress. */
export interface AtBatState {
  batter: BatterSummary;
  pitcher: PitcherSummary;
  /** Pitches of this at-bat in chronological order. */
  pitches: PitchDetail[];
  /** True when the count shown belongs to this at-bat. */
  isActive: boolean;
}

/** A batter waiting in the on-deck circle. */
export interface OnDeckBatter extends BatterSummary {
  /** 1-based slot in the offensive turn. */
  order: number;
  /** Short situation line, e.g. "ON-DECK · 2B · B:R". */
  note?: string;
}

/** One defensive position of the fielding alignment. */
export interface DefenseSlot {
  /** Position code: P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH. */
  position: string;
  playerName: string;
  /** Jersey number, when available. */
  jerseyNumber?: string;
}

/**
 * Where a batted ball landed, in the provider's coordinate system.
 * StatsAPI uses `coordX`/`coordY`; consumers map it to their own field SVG.
 */
export interface BattedBallLocation {
  x: number;
  y: number;
  /** "fly_ball", "line_drive", "ground_ball", "popup", ... */
  trajectory?: string;
  /** "soft", "medium", "hard". */
  hardness?: string;
  /** Provider hit location code (e.g. "7" = left field). */
  location?: string;
}

/** One item of the chronological play-by-play feed. */
export interface PlayByPlayItem {
  /** Monotonic sequence inside the game, unique per game. */
  sequence: number;
  inning: number;
  half: GameHalf;
  /** Description in the feed's language; the UI may localize labels only. */
  description: string;
  /** Tag used for chips/icons, e.g. "OUT", "HIT", "RUN", "PITCHING_CHANGE". */
  kind?: string;
  /** Runs scored on the play. */
  runsScored?: number;
  /** Score after the play, useful for replays and audits. */
  awayScore?: number;
  homeScore?: number;
  batterName?: string;
  pitcherName?: string;
  createdAt?: string;
  /** Batted-ball location, when the feed reports it. */
  hit?: BattedBallLocation;
}

/** Provenance of a state snapshot: who produced it and when. */
export interface FeedSourceInfo {
  adapter: FeedAdapterId;
  /** Human-readable source, e.g. "statsapi.mlb.com". */
  label?: string;
  /** ISO-8601 timestamp of the fetch that produced this state. */
  fetchedAt: string;
  /** SHA-256 of the normalized state, used by the poller for deduplication. */
  hash?: string;
}

/**
 * The canonical game state. Everything a tracker or overlay needs to paint a
 * frame lives here; nothing in this object is presentation-only.
 */
export interface CanonicalBaseballState {
  /** Contract version. Bump only on breaking changes. */
  schemaVersion: 1;
  gameId: string;
  league: LeagueCode;
  /** Season label, e.g. "2026-2027". */
  season?: string;
  status: GameStatus;
  /** Vendor status wording, kept for debugging. */
  statusDetail?: string;
  /** ISO-8601 scheduled start. */
  scheduledStart?: string;
  /** ISO-8601 actual first pitch. */
  startedAt?: string;
  /** ISO-8601 timestamp of this snapshot. */
  updatedAt: string;
  venue?: GameVenue;
  source: FeedSourceInfo;
  matchup: {
    away: TeamIdentity;
    home: TeamIdentity;
  };
  score: {
    away: number;
    home: number;
  };
  lineScore: LineScore;
  clock: GameClock;
  bases: BasesState;
  count: CountState;
  /** Present when a batter is at the plate. */
  atBat: AtBatState | null;
  /** Batters waiting after the current one. */
  onDeck: OnDeckBatter[];
  /** Fielding alignment of the team on defense. */
  defense: DefenseSlot[];
  /** Chronological feed, newest first or oldest first (the UI decides). */
  playByPlay: PlayByPlayItem[];
}

/* ────────────────────────────── Overlay control ───────────────────────────── */

/**
 * Panels that can be toggled independently on the OBS canvas.
 * Kept outside `CanonicalBaseballState` on purpose: panel visibility is
 * presentation state, not game state, but it rides the same realtime room.
 */
export const OVERLAY_PANEL_IDS = [
  "scoreboard",
  "ticker",
  "bases",
  "defense",
  "pitchLog",
  "duel",
  "strikeZone",
  "count",
  "onDeck",
  "lineScore",
  "playByPlay",
] as const;

export type OverlayPanelId = (typeof OVERLAY_PANEL_IDS)[number];

export interface OverlayControlState {
  visible: Record<OverlayPanelId, boolean>;
  /** ISO-8601 timestamp of the last operator action. */
  updatedAt: string;
}

/* ──────────────────────────────── Constants ──────────────────────────────── */

export const EMPTY_BASES: BasesState = { first: false, second: false, third: false };

export const EMPTY_COUNT: CountState = { balls: 0, strikes: 0, outs: 0 };

export const DEFAULT_OVERLAY_CONTROL: OverlayControlState = {
  visible: {
    scoreboard: true,
    ticker: true,
    bases: true,
    defense: true,
    pitchLog: true,
    duel: true,
    strikeZone: true,
    count: true,
    onDeck: true,
    lineScore: true,
    playByPlay: true,
  },
  updatedAt: new Date(0).toISOString(),
};

/** Builds an empty line score for a 9-inning game (softball may use 7). */
export function createEmptyLineScore(innings = 9): LineScore {
  const build = (): TeamLineScore => ({
    innings: Array.from({ length: innings }, (_, index) => ({
      inning: index + 1,
      runs: null,
    })),
    runs: 0,
    hits: 0,
    errors: 0,
  });

  return { away: build(), home: build() };
}

/** Converts MPH to KM/H, rounded to one decimal. */
export function mphToKmh(mph: number): number {
  return Math.round(mph * 1.609344 * 10) / 10;
}

/** Narrowing guard for `OverlayPanelId` coming from untrusted socket payloads. */
export function isOverlayPanelId(value: unknown): value is OverlayPanelId {
  return typeof value === "string" && (OVERLAY_PANEL_IDS as readonly string[]).includes(value);
}

/** Narrowing guard for `LeagueCode` coming from API/query parameters. */
export function isLeagueCode(value: unknown): value is LeagueCode {
  return typeof value === "string" && (LEAGUE_CODES as readonly string[]).includes(value);
}
