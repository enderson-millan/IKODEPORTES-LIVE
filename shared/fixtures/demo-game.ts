/**
 * Deterministic demo game used by the web shell, local development and the
 * contract smoke tests.
 *
 * Teams are fictional on purpose (S12): no league or club trademarks.
 * Timestamps are fixed so server and client render identical HTML.
 */

import type { CanonicalBaseballState, LineScoreInning } from "../types/baseball-state";

export const DEMO_GAME_ID = "demo-live";

const innings = (runs: Array<number | null>): LineScoreInning[] =>
  Array.from({ length: 9 }, (_, index) => ({
    inning: index + 1,
    runs: runs[index] ?? null,
  }));

export const demoGame: CanonicalBaseballState = {
  schemaVersion: 1,
  gameId: DEMO_GAME_ID,
  league: "CUSTOM",
  season: "2026",
  status: "LIVE",
  statusDetail: "In progress",
  scheduledStart: "2026-11-21T23:00:00.000Z",
  startedAt: "2026-11-21T23:07:00.000Z",
  updatedAt: "2026-11-21T18:45:00.000Z",
  venue: {
    name: "Estadio Olímpico del Norte",
    city: "Valencia",
    country: "Venezuela",
  },
  source: {
    adapter: "demo",
    label: "IKODEPORTES demo feed",
    fetchedAt: "2026-11-21T18:45:00.000Z",
    hash: "demo-fixture",
  },
  matchup: {
    away: {
      id: "demo-tit",
      code: "TIT",
      name: "Titanes de Oriente",
      shortName: "Titanes",
      primaryColor: "#FACC15",
      secondaryColor: "#1D4ED8",
    },
    home: {
      id: "demo-gua",
      code: "GUA",
      name: "Guardianes del Valle",
      shortName: "Guardianes",
      primaryColor: "#2563EB",
      secondaryColor: "#EAB308",
    },
  },
  score: { away: 4, home: 3 },
  lineScore: {
    away: {
      innings: innings([1, 2, 0, 1]),
      runs: 4,
      hits: 6,
      errors: 0,
    },
    home: {
      innings: innings([0, 0, 3]),
      runs: 3,
      hits: 4,
      errors: 1,
    },
  },
  clock: {
    inning: 4,
    half: "BOTTOM",
    isLive: true,
  },
  bases: {
    first: true,
    second: true,
    third: false,
    firstRunner: { id: "demo-run-1", name: "Ildemaro Vargas", jerseyNumber: "10" },
    secondRunner: { id: "demo-run-2", name: "José Sánchez", jerseyNumber: "4" },
  },
  count: { balls: 1, strikes: 2, outs: 1 },
  atBat: {
    batter: {
      id: "demo-bat-1",
      name: "Luis Ángel Rondón",
      bats: "R",
      average: 0.288,
      homeRuns: 2,
      rbi: 9,
      todayLine: "1-2, CI",
    },
    pitcher: {
      id: "demo-pit-1",
      name: "Darwin Salcedo",
      throws: "R",
      record: "2-1",
      era: 3.18,
      pitchCount: 58,
    },
    pitches: [
      {
        sequence: 1,
        type: "Slider",
        speedMph: 83,
        speedKmh: 134,
        result: "BALL",
      },
      {
        sequence: 2,
        type: "4-Seam",
        speedMph: 92,
        speedKmh: 148,
        result: "CALLED_STRIKE",
      },
      {
        sequence: 3,
        type: "Slider",
        speedMph: 84,
        speedKmh: 135,
        result: "SWINGING_STRIKE",
      },
      {
        sequence: 4,
        type: "4-Seam",
        speedMph: 93,
        speedKmh: 150,
        result: "FOUL",
      },
    ],
    isActive: true,
  },
  onDeck: [
    {
      id: "demo-bat-2",
      order: 1,
      name: "Ildemaro Vargas",
      bats: "S",
      average: 0.301,
      homeRuns: 1,
      rbi: 6,
      note: "ON-DECK · 2B · B:S",
    },
    {
      id: "demo-bat-3",
      order: 2,
      name: "Luisangel Acuña",
      bats: "R",
      average: 0.4,
      homeRuns: 0,
      rbi: 3,
      note: "IN-THE-HOLE · CF · B:R",
    },
  ],
  defense: [
    { position: "P", playerName: "Darwin Salcedo", jerseyNumber: "48" },
    { position: "C", playerName: "Alfredo Duno", jerseyNumber: "83" },
    { position: "1B", playerName: "Aldrem Corredor", jerseyNumber: "37" },
    { position: "2B", playerName: "Wilfredo Tovar", jerseyNumber: "7" },
    { position: "3B", playerName: "Lenyn Sosa", jerseyNumber: "58" },
    { position: "SS", playerName: "Marvin Alcantara", jerseyNumber: "21" },
    { position: "LF", playerName: "Wilfredo Antunez", jerseyNumber: "43" },
    { position: "CF", playerName: "Yonathan Daza", jerseyNumber: "22" },
    { position: "RF", playerName: "Victor Bericoto", jerseyNumber: "71" },
  ],
  playByPlay: [
    {
      sequence: 1,
      inning: 1,
      half: "TOP",
      description:
        "Rafael Ortega conecta sencillo al jardín derecho y remolca la primera carrera del juego.",
      kind: "HIT",
      runsScored: 1,
      awayScore: 1,
      homeScore: 0,
      batterName: "Rafael Ortega",
      pitcherName: "Ronald Medrano",
      createdAt: "2026-11-21T23:18:00.000Z",
    },
    {
      sequence: 2,
      inning: 2,
      half: "TOP",
      description:
        "Doble de Yonny Hernández al jardín izquierdo: dos carreras más para los Titanes.",
      kind: "HIT",
      runsScored: 2,
      awayScore: 3,
      homeScore: 0,
      batterName: "Yonny Hernández",
      pitcherName: "Ronald Medrano",
      createdAt: "2026-11-21T23:34:00.000Z",
    },
    {
      sequence: 3,
      inning: 3,
      half: "BOTTOM",
      description:
        "Cuadrangular de Carlos Méndez con dos a bordo y la pizarra se empata en el tercero.",
      kind: "HOME_RUN",
      runsScored: 3,
      awayScore: 3,
      homeScore: 3,
      batterName: "Carlos Méndez",
      pitcherName: "Darwin Salcedo",
      createdAt: "2026-11-21T23:52:00.000Z",
    },
    {
      sequence: 4,
      inning: 4,
      half: "TOP",
      description:
        "Elevado de sacrificio de Wilfredo Antunez: Yonathan Daza anota la cuarta carrera desde la antesala.",
      kind: "SAC_FLY",
      runsScored: 1,
      awayScore: 4,
      homeScore: 3,
      batterName: "Wilfredo Antunez",
      pitcherName: "Ronald Medrano",
      createdAt: "2026-11-22T00:12:00.000Z",
      hit: {
        x: 88,
        y: 113,
        trajectory: "fly_ball",
        hardness: "medium",
        location: "7",
      },
    },
  ],
};
