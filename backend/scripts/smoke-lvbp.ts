import { MlbStatsAdapter } from "../src/modules/feeds/mlb-stats-adapter";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[smoke] ${message}`);
}

async function main(): Promise<void> {
  const adapter = new MlbStatsAdapter({ league: "LVBP", sportId: 17, leagueId: 135 });

  const games = await adapter.listGames();
  assert(games.length > 0, "schedule returned no games");

  const target = games.find((game) => game.status === "LIVE") ?? games[0];
  assert(target, "no target game");

  const snapshot = await adapter.fetchState(target.gameId);
  const state = snapshot.state;

  assert(state.gameId === target.gameId, "gameId mismatch");
  assert(state.league === "LVBP", "league should be LVBP");
  assert(state.lineScore.away.innings.length >= 9, "line score should have innings");
  assert(state.matchup.away.code.length === 3, "away code should be 3 letters");
  assert(state.matchup.home.code.length === 3, "home code should be 3 letters");
  assert(state.count.outs >= 0 && state.count.outs <= 3, "outs out of range");
  assert(state.playByPlay.length > 0, "play-by-play is empty");

  if (state.status === "LIVE") {
    assert(state.defense.length === 9, "live defense should have 9 fielders");
    assert(state.atBat !== null, "live game should have an at-bat");
  }

  const bases = [
    state.bases.first ? "1B" : null,
    state.bases.second ? "2B" : null,
    state.bases.third ? "3B" : null,
  ].filter(Boolean);

  const lastHit = [...state.playByPlay].reverse().find((play) => play.hit)?.hit ?? null;

  console.log(
    JSON.stringify(
      {
        scheduleGames: games.length,
        gameId: state.gameId,
        status: state.status,
        score: state.score,
        clock: state.clock,
        count: state.count,
        bases,
        runners: {
          first: state.bases.firstRunner?.name ?? null,
          second: state.bases.secondRunner?.name ?? null,
          third: state.bases.thirdRunner?.name ?? null,
        },
        defense: state.defense.length,
        plays: state.playByPlay.length,
        lastHit,
        atBat: state.atBat
          ? {
              batter: state.atBat.batter.name,
              average: state.atBat.batter.average,
              pitcher: state.atBat.pitcher.name,
              era: state.atBat.pitcher.era,
              pitches: state.atBat.pitches.length,
            }
          : null,
        timeStamp: snapshot.timeStamp,
      },
      null,
      2,
    ),
  );

  const patch = await adapter.fetchPatch(target.gameId, snapshot.timeStamp);
  console.log(`[smoke] diffPatch idle=${patch === null} ops=${patch?.operations.length ?? 0}`);
  console.log("[smoke] OK");
}

main().catch((error) => {
  console.error("[smoke] FAILED", error);
  process.exit(1);
});
