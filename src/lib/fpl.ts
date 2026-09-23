const FPL_BASE = "https://fantasy.premierleague.com/api";
const HEADERS = { "User-Agent": "Mozilla/5.0" };

export interface FplTeam {
  id: number;
  code: number;
  name: string;
  short_name: string;
  strength_overall_home: number;
  strength_overall_away: number;
  played: number;
}

export interface FplElement {
  id: number;
  code: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  form: string;
  status: string;
  news: string;
  chance_of_playing_next_round: number | null;
  minutes: number;
  starts: number;
  expected_goal_involvements_per_90: number;
  clean_sheets_per_90: number;
  defensive_contribution_per_90: number;
  saves_per_90: number;
  total_points: number;
  points_per_game: string;
  selected_by_percent: string;
}

export interface FplFixture {
  id: number;
  event: number | null;
  finished: boolean;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
}

export interface FplElementType {
  id: number;
  singular_name_short: string;
}

export interface FplEvent {
  id: number;
  is_current: boolean;
  is_next: boolean;
}

export interface Bootstrap {
  teams: FplTeam[];
  elements: FplElement[];
  element_types: FplElementType[];
  events: FplEvent[];
}

export interface FplPick {
  element: number;
}

export interface FplPicksResponse {
  entry_history: {
    bank: number;
    value: number;
  };
  picks: FplPick[];
}

export class TeamNotFoundError extends Error {}

let bootstrapCache: { data: Bootstrap; fetchedAt: number } | null = null;
let fixturesCache: { data: FplFixture[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function getBootstrap(): Promise<Bootstrap> {
  if (bootstrapCache && Date.now() - bootstrapCache.fetchedAt < CACHE_TTL_MS) {
    return bootstrapCache.data;
  }
  const res = await fetch(`${FPL_BASE}/bootstrap-static/`, { headers: HEADERS });
  if (!res.ok) throw new Error(`FPL bootstrap-static failed: ${res.status}`);
  const data = (await res.json()) as Bootstrap;
  bootstrapCache = { data, fetchedAt: Date.now() };
  return data;
}

export async function getFixtures(): Promise<FplFixture[]> {
  if (fixturesCache && Date.now() - fixturesCache.fetchedAt < CACHE_TTL_MS) {
    return fixturesCache.data;
  }
  const res = await fetch(`${FPL_BASE}/fixtures/`, { headers: HEADERS });
  if (!res.ok) throw new Error(`FPL fixtures failed: ${res.status}`);
  const data = (await res.json()) as FplFixture[];
  fixturesCache = { data, fetchedAt: Date.now() };
  return data;
}

export function searchPlayers(bootstrap: Bootstrap, query: string, limit = 8): FplElement[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return bootstrap.elements
    .filter(
      (e) =>
        e.web_name.toLowerCase().includes(q) ||
        `${e.first_name} ${e.second_name}`.toLowerCase().includes(q)
    )
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);
}

export function getPlayerById(bootstrap: Bootstrap, id: number): FplElement | undefined {
  return bootstrap.elements.find((e) => e.id === id);
}

export function getTeamById(bootstrap: Bootstrap, id: number): FplTeam | undefined {
  return bootstrap.teams.find((t) => t.id === id);
}

export function getPositionShort(bootstrap: Bootstrap, elementType: number): string {
  return bootstrap.element_types.find((t) => t.id === elementType)?.singular_name_short ?? "?";
}

export function getTeamBadgeUrl(teamCode: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
}

export function getPlayerPhotoUrl(playerCode: number): string {
  return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${playerCode}.png`;
}

export function getCurrentEventId(bootstrap: Bootstrap): number {
  const current = bootstrap.events.find((e) => e.is_current);
  const next = bootstrap.events.find((e) => e.is_next);
  return current?.id ?? next?.id ?? 1;
}

export async function getTeamPicks(teamId: number, eventId: number): Promise<FplPicksResponse> {
  const res = await fetch(`${FPL_BASE}/entry/${teamId}/event/${eventId}/picks/`, {
    headers: HEADERS,
  });
  if (res.status === 404) throw new TeamNotFoundError(`Team ${teamId} not found`);
  if (!res.ok) throw new Error(`FPL entry picks failed: ${res.status}`);
  return (await res.json()) as FplPicksResponse;
}
