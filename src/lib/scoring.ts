import {
  Bootstrap,
  FplElement,
  FplFixture,
  getPlayerPhotoUrl,
  getPositionShort,
  getTeamBadgeUrl,
  getTeamById,
} from "./fpl";

export interface UpcomingFixture {
  gw: number;
  opponent: string;
  isHome: boolean;
  opponentStrength: number;
}

export interface PlayerScore {
  playerId: number;
  webName: string;
  teamShortName: string;
  position: string;
  photoUrl: string;
  badgeUrl: string;
  priceM: number;
  xGI90: number;
  minutesReliability: number;
  fixtureEasiness: number;
  score: number;
  upcomingFixtures: UpcomingFixture[];
  status: string;
  news: string;
}

/**
 * Opponent strength for the next `gwWindow` unplayed fixtures, using
 * strength_overall_home/away (the only per-team strength field FPL still
 * populates — strength_attack/defence are 0 for every team this season).
 */
function getUpcomingFixtures(
  bootstrap: Bootstrap,
  fixtures: FplFixture[],
  teamId: number,
  gwWindow: number
): UpcomingFixture[] {
  return fixtures
    .filter((f) => !f.finished && f.event !== null && (f.team_h === teamId || f.team_a === teamId))
    .sort((a, b) => (a.event ?? 0) - (b.event ?? 0))
    .slice(0, gwWindow)
    .map((f) => {
      const isHome = f.team_h === teamId;
      const opponentId = isHome ? f.team_a : f.team_h;
      const opponent = getTeamById(bootstrap, opponentId);
      // Opponent's strength when playing at the venue THEY are at for this fixture.
      const opponentStrength = opponent
        ? isHome
          ? opponent.strength_overall_away
          : opponent.strength_overall_home
        : 3;
      return {
        gw: f.event ?? 0,
        opponent: opponent?.short_name ?? "UNK",
        isHome,
        opponentStrength,
      };
    });
}

export function computePlayerScore(
  bootstrap: Bootstrap,
  fixtures: FplFixture[],
  player: FplElement,
  gwWindow = 3
): PlayerScore {
  const team = getTeamById(bootstrap, player.team);
  const upcoming = getUpcomingFixtures(bootstrap, fixtures, player.team, gwWindow);

  const xGI90 = player.expected_goal_involvements_per_90 ?? 0;

  // Minutes reliability: share of available team minutes actually played.
  const teamMinutesAvailable = Math.max(team?.played ?? 1, 1) * 90;
  const minutesReliability = Math.min(player.minutes / teamMinutesAvailable, 1);

  // Fixture easiness: invert average opponent strength (roughly 2-5 scale) to 0-1ish.
  const avgOpponentStrength =
    upcoming.length > 0
      ? upcoming.reduce((sum, f) => sum + f.opponentStrength, 0) / upcoming.length
      : 3.5;
  const fixtureEasiness = Math.max(6 - avgOpponentStrength, 0.5) / 5;

  const score = xGI90 * fixtureEasiness * minutesReliability;

  return {
    playerId: player.id,
    webName: player.web_name,
    teamShortName: team?.short_name ?? "UNK",
    position: getPositionShort(bootstrap, player.element_type),
    photoUrl: getPlayerPhotoUrl(player.code),
    badgeUrl: team ? getTeamBadgeUrl(team.code) : "",
    priceM: player.now_cost / 10,
    xGI90: Number(xGI90.toFixed(2)),
    minutesReliability: Number(minutesReliability.toFixed(2)),
    fixtureEasiness: Number(fixtureEasiness.toFixed(2)),
    score: Number(score.toFixed(3)),
    upcomingFixtures: upcoming,
    status: player.status,
    news: player.news,
  };
}
