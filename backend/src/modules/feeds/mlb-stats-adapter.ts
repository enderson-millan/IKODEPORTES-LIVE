import type {
  AtBatState,
  BasesState,
  BatterSummary,
  CanonicalBaseballState,
  CountState,
  DefenseSlot,
  FeedAdapterId,
  GameHalf,
  GameStatus,
  LeagueCode,
  LineScore,
  OnDeckBatter,
  PitchDetail,
  PitchResult,
  PlayByPlayItem,
  TeamIdentity,
  TeamLineScore,
} from "../../../../shared/types/baseball-state";
import type {
  FeedGameSummary,
  FeedPatch,
  FeedSnapshot,
  IBaseballFeedAdapter,
  JsonPatchOperation,
} from "./types";

/* ───────────────────────────── Raw StatsAPI shapes ───────────────────────── */

interface RawPerson {
  id?: number;
  fullName?: string;
}

interface RawTeamInfo {
  id?: number;
  name?: string;
  abbreviation?: string;
  teamName?: string;
  shortName?: string;
  teamCode?: string;
}

/**
 * The schedule endpoint wraps the team in `{ team, score }`, while the live
 * feed puts the team fields at the top level (no `team` key, no `score`).
 * Both shapes are accepted.
 */
interface RawTeamSide extends RawTeamInfo {
  team?: RawTeamInfo;
  score?: number;
  isWinner?: boolean;
}

interface RawStatus {
  abstractGameState?: string;
  codedGameState?: string;
  detailedState?: string;
}

interface RawInningSide {
  runs?: number;
  hits?: number;
  errors?: number;
}

interface RawInning {
  num?: number;
  away?: RawInningSide;
  home?: RawInningSide;
}

interface RawDefense {
  team?: RawTeamInfo;
  pitcher?: RawPerson;
  catcher?: RawPerson;
  first?: RawPerson;
  second?: RawPerson;
  third?: RawPerson;
  shortstop?: RawPerson;
  left?: RawPerson;
  center?: RawPerson;
  right?: RawPerson;
  batter?: RawPerson;
  onDeck?: RawPerson;
  inHole?: RawPerson;
}

interface RawOffense {
  team?: RawTeamInfo;
  batter?: RawPerson;
  onDeck?: RawPerson;
  inHole?: RawPerson;
  pitcher?: RawPerson;
  first?: RawPerson;
  second?: RawPerson;
  third?: RawPerson;
}

interface RawLinescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningHalf?: string;
  isTopInning?: boolean;
  scheduledInnings?: number;
  innings?: RawInning[];
  teams?: { away?: RawInningSide; home?: RawInningSide };
  defense?: RawDefense;
  offense?: RawOffense;
  balls?: number;
  strikes?: number;
  outs?: number;
}

interface RawPlayEvent {
  isPitch?: boolean;
  details?: {
    call?: { code?: string; description?: string };
    type?: { code?: string; description?: string };
    description?: string;
    isInPlay?: boolean;
  };
  pitchData?: {
    startSpeed?: number;
    zone?: number;
    coordinates?: { x?: number; y?: number };
  };
  hitData?: {
    coordinates?: { coordX?: number; coordY?: number };
    trajectory?: string;
    hardness?: string;
    location?: string;
  };
}

interface RawPlay {
  about?: {
    atBatIndex?: number;
    inning?: number;
    halfInning?: string;
    isTopInning?: boolean;
    isComplete?: boolean;
    isScoringPlay?: boolean;
    endTime?: string;
  };
  result?: {
    type?: string;
    event?: string;
    eventType?: string;
    description?: string;
    rbi?: number;
    awayScore?: number;
    homeScore?: number;
    isOut?: boolean;
  };
  matchup?: { batter?: RawPerson; pitcher?: RawPerson };
  playEvents?: RawPlayEvent[];
}

interface RawBattingStats {
  avg?: string | number;
  homeRuns?: number;
  rbi?: number;
  summary?: string;
}

interface RawPitchingStats {
  era?: string | number;
  wins?: number;
  losses?: number;
  numberOfPitches?: number;
  pitchesThrown?: number;
}

interface RawBoxPlayer {
  person?: RawPerson & { batSide?: { code?: string }; pitchHand?: { code?: string } };
  jerseyNumber?: string;
  position?: { abbreviation?: string };
  stats?: { batting?: RawBattingStats; pitching?: RawPitchingStats };
  seasonStats?: { batting?: RawBattingStats; pitching?: RawPitchingStats };
}

interface RawTeamBox {
  team?: RawTeamInfo;
  players?: Record<string, RawBoxPlayer>;
}

type RawPlayersMap = Record<
  string,
  { fullName?: string; batSide?: { code?: string }; pitchHand?: { code?: string } }
>;

interface RawScheduleGame {
  gamePk?: number;
  gameDate?: string;
  status?: RawStatus;
  teams?: { away?: RawTeamSide; home?: RawTeamSide };
  venue?: { name?: string };
  linescore?: { currentInning?: number; isTopInning?: boolean };
}

export interface StatsApiFeed {
  gamePk?: number;
  metaData?: { timeStamp?: string; wait?: number };
  gameData?: {
    game?: { pk?: number; season?: string };
    status?: RawStatus;
    teams?: { away?: RawTeamSide; home?: RawTeamSide };
    players?: RawPlayersMap;
    venue?: { name?: string; location?: { city?: string; country?: string } };
    datetime?: { dateTime?: string };
    league?: { id?: number; name?: string };
  };
  liveData?: {
    linescore?: RawLinescore;
    boxscore?: { teams?: { away?: RawTeamBox; home?: RawTeamBox } };
    plays?: {
      allPlays?: RawPlay[];
      currentPlay?: RawPlay;
      scoringPlays?: number[];
    };
  };
}

/* ──────────────────────────────── Mapping ────────────────────────────────── */

const DEFENSE_SLOTS = [
  ["pitcher", "P"],
  ["catcher", "C"],
  ["first", "1B"],
  ["second", "2B"],
  ["third", "3B"],
  ["shortstop", "SS"],
  ["left", "LF"],
  ["center", "CF"],
  ["right", "RF"],
] as const;

const EMPTY_COUNT: CountState = { balls: 0, strikes: 0, outs: 0 };

function playerKey(id?: number): string {
  return id === undefined ? "" : `ID${id}`;
}

function toBatSide(value?: string): "L" | "R" | "S" | undefined {
  return value === "L" || value === "R" || value === "S" ? value : undefined;
}

function toThrowHand(value?: string): "L" | "R" | undefined {
  return value === "L" || value === "R" ? value : undefined;
}

function toTeam(team?: RawTeamInfo): TeamIdentity {
  return {
    id: team?.id === undefined ? "" : String(team.id),
    code: (team?.abbreviation ?? team?.teamCode ?? "TBD").toUpperCase().slice(0, 3),
    name: team?.name ?? "—",
    shortName: team?.teamName ?? team?.shortName,
  };
}

function unwrapTeam(side?: RawTeamSide): RawTeamInfo | undefined {
  return side?.team ?? side;
}

function toStatus(status?: RawStatus): GameStatus {
  if (status?.codedGameState === "I" || status?.abstractGameState === "Live") return "LIVE";
  if (status?.codedGameState === "F" || status?.abstractGameState === "Final") return "FINAL";
  // StatsAPI uses "D" for Delayed; the contract has no DELAYED state yet.
  if (status?.codedGameState === "D") return "POSTPONED";
  if (status?.codedGameState === "C") return "CANCELED";
  return "SCHEDULED";
}

function toHalf(linescore: RawLinescore): GameHalf {
  if (linescore.inningHalf === "Bottom") return "BOTTOM";
  if (linescore.isTopInning === false) return "BOTTOM";
  return "TOP";
}

export function parseStatsApiTimestamp(value?: string): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`;
}

function toRunner(person: RawPerson | undefined, box: RawTeamBox | undefined) {
  if (person?.id === undefined) return undefined;
  const player = box?.players?.[playerKey(person.id)];
  return {
    id: String(person.id),
    name: person.fullName ?? "—",
    jerseyNumber: player?.jerseyNumber,
  };
}

function toBases(offense: RawOffense | undefined, battingBox: RawTeamBox | undefined): BasesState {
  return {
    first: Boolean(offense?.first),
    second: Boolean(offense?.second),
    third: Boolean(offense?.third),
    firstRunner: toRunner(offense?.first, battingBox),
    secondRunner: toRunner(offense?.second, battingBox),
    thirdRunner: toRunner(offense?.third, battingBox),
  };
}

function toLineScore(linescore: RawLinescore): LineScore {
  const inningCount = Math.max(linescore.scheduledInnings ?? 9, linescore.innings?.length ?? 0);

  const build = (side: "away" | "home"): TeamLineScore => ({
    innings: Array.from({ length: inningCount }, (_, index) => {
      const inning = linescore.innings?.find((candidate) => candidate.num === index + 1);
      const runs = inning?.[side]?.runs;
      return { inning: index + 1, runs: runs === undefined ? null : runs };
    }),
    runs: linescore.teams?.[side]?.runs ?? 0,
    hits: linescore.teams?.[side]?.hits ?? 0,
    errors: linescore.teams?.[side]?.errors ?? 0,
  });

  return { away: build("away"), home: build("home") };
}

function toPitchResult(event: RawPlayEvent): PitchResult {
  if (event.details?.isInPlay) return "IN_PLAY";
  switch (event.details?.call?.code) {
    case "B":
      return "BALL";
    case "C":
      return "CALLED_STRIKE";
    case "S":
      return "SWINGING_STRIKE";
    case "F":
      return "FOUL";
    case "H":
      return "HIT_BY_PITCH";
    default:
      return "OTHER";
  }
}

function toPitch(event: RawPlayEvent, index: number): PitchDetail {
  const speedMph = event.pitchData?.startSpeed;
  return {
    sequence: index + 1,
    type: event.details?.type?.description ?? event.details?.type?.code ?? "Pitch",
    speedMph: typeof speedMph === "number" ? speedMph : undefined,
    speedKmh: typeof speedMph === "number" ? Math.round(speedMph * 1.609344 * 10) / 10 : undefined,
    result: toPitchResult(event),
    description: event.details?.description,
  };
}

function toBatter(
  person: RawPerson,
  box: RawTeamBox | undefined,
  players: RawPlayersMap | undefined,
): BatterSummary {
  const key = playerKey(person.id);
  const player = box?.players?.[key];
  const season = player?.seasonStats?.batting;
  const game = player?.stats?.batting;

  return {
    id: person.id === undefined ? undefined : String(person.id),
    name: person.fullName ?? "—",
    bats: toBatSide(player?.person?.batSide?.code ?? players?.[key]?.batSide?.code),
    average: season?.avg,
    homeRuns: season?.homeRuns,
    rbi: season?.rbi,
    todayLine: game?.summary,
  };
}

function toPitcher(
  person: RawPerson,
  box: RawTeamBox | undefined,
  players: RawPlayersMap | undefined,
): AtBatState["pitcher"] {
  const key = playerKey(person.id);
  const player = box?.players?.[key];
  const season = player?.seasonStats?.pitching;
  const game = player?.stats?.pitching;
  const rawEra = season?.era;
  const parsedEra =
    typeof rawEra === "number"
      ? rawEra
      : typeof rawEra === "string"
        ? Number.parseFloat(rawEra)
        : undefined;

  return {
    id: person.id === undefined ? undefined : String(person.id),
    name: person.fullName ?? "—",
    throws: toThrowHand(player?.person?.pitchHand?.code ?? players?.[key]?.pitchHand?.code),
    record:
      season?.wins !== undefined && season?.losses !== undefined
        ? `${season.wins}-${season.losses}`
        : undefined,
    era: Number.isFinite(parsedEra) ? parsedEra : undefined,
    pitchCount: game?.numberOfPitches ?? game?.pitchesThrown,
  };
}

function toOnDeck(
  person: RawPerson | undefined,
  order: number,
  label: string,
  box: RawTeamBox | undefined,
): OnDeckBatter | null {
  if (!person?.fullName) return null;
  const key = playerKey(person.id);
  const player = box?.players?.[key];
  const season = player?.seasonStats?.batting;
  const position = player?.position?.abbreviation;
  const bats = player?.person?.batSide?.code;

  return {
    id: person.id === undefined ? undefined : String(person.id),
    order,
    name: person.fullName,
    average: season?.avg,
    homeRuns: season?.homeRuns,
    rbi: season?.rbi,
    note: [label, position, bats ? `B:${bats}` : undefined].filter(Boolean).join(" · "),
  };
}

function extractHit(play: RawPlay): PlayByPlayItem["hit"] {
  const events = play.playEvents ?? [];
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const candidate = events[index]?.hitData;
    const x = candidate?.coordinates?.coordX;
    const y = candidate?.coordinates?.coordY;
    if (typeof x === "number" && typeof y === "number") {
      return {
        x,
        y,
        trajectory: candidate?.trajectory,
        hardness: candidate?.hardness,
        location: candidate?.location,
      };
    }
  }
  return undefined;
}

function toPlay(play: RawPlay, index: number): PlayByPlayItem {
  return {
    sequence: index + 1,
    inning: play.about?.inning ?? 1,
    half: play.about?.isTopInning ? "TOP" : "BOTTOM",
    description: play.result?.description ?? "",
    kind: play.result?.eventType ?? play.result?.event ?? play.result?.type,
    runsScored: play.result?.rbi ?? 0,
    awayScore: play.result?.awayScore,
    homeScore: play.result?.homeScore,
    batterName: play.matchup?.batter?.fullName,
    pitcherName: play.matchup?.pitcher?.fullName,
    createdAt: play.about?.endTime,
    hit: extractHit(play),
  };
}

/**
 * Normalizes a StatsAPI `feed/live` payload into the canonical contract.
 * Pure and side-effect free: used both for the bootstrap and after each patch.
 */
export function normalizeStatsApiFeed(
  feed: StatsApiFeed,
  league: LeagueCode = "LVBP",
): CanonicalBaseballState {
  const linescore = feed.liveData?.linescore ?? {};
  const gameData = feed.gameData ?? {};
  const awaySide = gameData.teams?.away;
  const homeSide = gameData.teams?.home;
  const away = toTeam(unwrapTeam(awaySide));
  const home = toTeam(unwrapTeam(homeSide));
  const status = toStatus(gameData.status);
  const half = toHalf(linescore);

  const battingTeamId = linescore.offense?.team?.id;
  const battingSide: "away" | "home" =
    battingTeamId !== undefined && String(battingTeamId) === home.id ? "home" : "away";
  const fieldingSide: "away" | "home" = battingSide === "away" ? "home" : "away";
  const boxscore = feed.liveData?.boxscore?.teams;
  const battingBox = battingSide === "away" ? boxscore?.away : boxscore?.home;
  const fieldingBox = fieldingSide === "away" ? boxscore?.away : boxscore?.home;
  const players = gameData.players;

  const defense: DefenseSlot[] = DEFENSE_SLOTS.flatMap(([key, position]) => {
    const person = linescore.defense?.[key];
    if (!person?.fullName) return [];
    const player = fieldingBox?.players?.[playerKey(person.id)];
    return [{ position, playerName: person.fullName, jerseyNumber: player?.jerseyNumber }];
  });

  const onDeck = [
    toOnDeck(linescore.offense?.onDeck, 1, "ON-DECK", battingBox),
    toOnDeck(linescore.offense?.inHole, 2, "IN-THE-HOLE", battingBox),
  ].filter((batter): batter is OnDeckBatter => batter !== null);

  const currentPlay = feed.liveData?.plays?.currentPlay;
  const pitches = (currentPlay?.playEvents ?? [])
    .filter((event) => event.isPitch === true)
    .map((event, index) => toPitch(event, index));

  const batter = linescore.offense?.batter;
  const pitcher = linescore.defense?.pitcher;
  const atBat: AtBatState | null =
    batter?.fullName && pitcher?.fullName
      ? {
          batter: toBatter(batter, battingBox, players),
          pitcher: toPitcher(pitcher, fieldingBox, players),
          pitches,
          isActive: status === "LIVE",
        }
      : null;

  const playByPlay = (feed.liveData?.plays?.allPlays ?? [])
    .filter((play) => Boolean(play.result?.description))
    .map((play, index) => toPlay(play, index))
    .sort((left, right) => left.sequence - right.sequence);

  return {
    schemaVersion: 1,
    gameId: String(feed.gamePk ?? gameData.game?.pk ?? ""),
    league,
    season: gameData.game?.season,
    status,
    statusDetail: gameData.status?.detailedState,
    scheduledStart: gameData.datetime?.dateTime,
    updatedAt: parseStatsApiTimestamp(feed.metaData?.timeStamp) ?? new Date().toISOString(),
    venue: gameData.venue?.name
      ? {
          name: gameData.venue.name,
          city: gameData.venue.location?.city,
          country: gameData.venue.location?.country,
        }
      : undefined,
    source: {
      adapter: "mlb-stats",
      label: "statsapi.mlb.com",
      fetchedAt: new Date().toISOString(),
    },
    matchup: { away, home },
    score: {
      away: awaySide?.score ?? linescore.teams?.away?.runs ?? 0,
      home: homeSide?.score ?? linescore.teams?.home?.runs ?? 0,
    },
    lineScore: toLineScore(linescore),
    clock: {
      inning: linescore.currentInning ?? 1,
      half,
      isLive: status === "LIVE",
    },
    bases: toBases(linescore.offense, battingBox),
    count: {
      balls: linescore.balls ?? EMPTY_COUNT.balls,
      strikes: linescore.strikes ?? EMPTY_COUNT.strikes,
      outs: linescore.outs ?? EMPTY_COUNT.outs,
    },
    atBat,
    onDeck,
    defense,
    playByPlay,
  };
}

/* ──────────────────────────────── Adapter ────────────────────────────────── */

export interface MlbStatsAdapterOptions {
  league?: LeagueCode;
  sportId?: number;
  leagueId?: number;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

function todayInCaracas(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * MLB StatsAPI adapter. Serves MLB (`sportId=1`) and winter leagues such as
 * LVBP (`sportId=17`, `leagueId=135`) with the same payload shape.
 */
export class MlbStatsAdapter implements IBaseballFeedAdapter {
  readonly id: FeedAdapterId = "mlb-stats";
  readonly league: LeagueCode;

  private readonly sportId: number;
  private readonly leagueId?: number;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MlbStatsAdapterOptions = {}) {
    this.league = options.league ?? "LVBP";
    this.sportId = options.sportId ?? 17;
    this.leagueId = options.leagueId ?? 135;
    this.baseUrl = (options.baseUrl ?? "https://statsapi.mlb.com").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async listGames(date = todayInCaracas()): Promise<FeedGameSummary[]> {
    const params = new URLSearchParams({
      sportId: String(this.sportId),
      date,
      hydrate: "linescore,team",
    });
    if (this.leagueId !== undefined) {
      params.set("leagueId", String(this.leagueId));
    }

    const payload = await this.getJson<{ dates?: Array<{ games?: RawScheduleGame[] }> }>(
      `${this.baseUrl}/api/v1/schedule?${params.toString()}`,
    );

    return (payload.dates ?? [])
      .flatMap((day) => day.games ?? [])
      .map((game) => {
        const status = toStatus(game.status);
        const inning = game.linescore?.currentInning;
        return {
          gameId: String(game.gamePk ?? ""),
          league: this.league,
          status,
          away: toTeam(unwrapTeam(game.teams?.away)),
          home: toTeam(unwrapTeam(game.teams?.home)),
          awayScore: game.teams?.away?.score ?? 0,
          homeScore: game.teams?.home?.score ?? 0,
          scheduledStart: game.gameDate,
          inning: inning && inning > 0 ? inning : undefined,
          half:
            inning && inning > 0
              ? game.linescore?.isTopInning === false
                ? "BOTTOM"
                : "TOP"
              : undefined,
        };
      });
  }

  async fetchState(gameId: string): Promise<FeedSnapshot> {
    const raw = await this.getJson<StatsApiFeed>(
      `${this.baseUrl}/api/v1.1/game/${encodeURIComponent(gameId)}/feed/live`,
    );
    return this.normalize(raw);
  }

  normalize(raw: unknown): FeedSnapshot {
    const feed = raw as StatsApiFeed;
    return {
      state: normalizeStatsApiFeed(feed, this.league),
      raw: feed,
      timeStamp: feed.metaData?.timeStamp ?? "",
    };
  }

  async fetchPatch(gameId: string, fromTimeStamp: string): Promise<FeedPatch | null> {
    if (!fromTimeStamp) return null;

    const url =
      `${this.baseUrl}/api/v1.1/game/${encodeURIComponent(gameId)}/feed/live/diffPatch` +
      `?startTimecode=${encodeURIComponent(fromTimeStamp)}`;

    const payload = await this.getJson<Array<{ diff?: JsonPatchOperation[] }>>(url);
    const operations = payload.flatMap((entry) => entry.diff ?? []);
    if (operations.length === 0) return null;

    return { timeStamp: fromTimeStamp, operations };
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await this.fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        "User-Agent": "IKODEPORTES-Live/0.1 (+https://live.ikodeportes.com)",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`[mlb-stats] ${response.status} ${response.statusText} · ${url}`);
    }

    return (await response.json()) as T;
  }
}
