import { getBootstrap, getFixtures, getPlayerById } from "./fpl";
import { computePlayerScore, PlayerScore } from "./scoring";

export interface Comparison {
  gwWindow: number;
  out: PlayerScore;
  in: PlayerScore;
  scoreDelta: number;
  priceDelta: number;
}

export class PlayerNotFoundError extends Error {}

export async function getComparison(
  outId: number,
  inId: number,
  gwWindow: number
): Promise<Comparison> {
  const [bootstrap, fixtures] = await Promise.all([getBootstrap(), getFixtures()]);

  const outPlayer = getPlayerById(bootstrap, outId);
  const inPlayer = getPlayerById(bootstrap, inId);

  if (!outPlayer || !inPlayer) {
    throw new PlayerNotFoundError("Player not found");
  }

  const outScore = computePlayerScore(bootstrap, fixtures, outPlayer, gwWindow);
  const inScore = computePlayerScore(bootstrap, fixtures, inPlayer, gwWindow);

  return {
    gwWindow,
    out: outScore,
    in: inScore,
    scoreDelta: Number((inScore.score - outScore.score).toFixed(3)),
    priceDelta: Number((inScore.priceM - outScore.priceM).toFixed(1)),
  };
}
