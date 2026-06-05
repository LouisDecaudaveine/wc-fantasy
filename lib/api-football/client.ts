const DEFAULT_API_BASE = "https://worldcup26.ir";

/** Stadium local time → UTC offset (hours) during June/July 2026 */
const STADIUM_UTC_OFFSET_HOURS: Record<string, number> = {
  "1": -6,
  "2": -6,
  "3": -6,
  "4": -5,
  "5": -5,
  "6": -5,
  "7": -4,
  "8": -4,
  "9": -4,
  "10": -4,
  "11": -4,
  "12": -4,
  "13": -7,
  "14": -7,
  "15": -7,
  "16": -7,
};

type WorldCupGameRaw = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
};

type WorldCupTeamRaw = {
  id: string;
  name_en: string;
  flag: string;
};

type GamesResponse = { games: WorldCupGameRaw[] };
type TeamsResponse = { teams: WorldCupTeamRaw[] };

export type MatchFixture = {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  kickoffAt: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  stage: string;
  round: string;
};

export class WorldCupApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorldCupApiError";
  }
}

function apiBase(): string {
  return process.env.WORLDCUP26_API_BASE ?? DEFAULT_API_BASE;
}

const FETCH_TIMEOUT_MS = 15_000;

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBase()}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new WorldCupApiError(
        `World Cup API request failed: ${response.status} ${path}`,
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new WorldCupApiError(
        `World Cup API request timed out after ${FETCH_TIMEOUT_MS}ms: ${path}`,
      );
    }

    if (error instanceof WorldCupApiError) {
      throw error;
    }

    throw new WorldCupApiError(
      `World Cup API request failed: ${path}${
        error instanceof Error ? `: ${error.message}` : ""
      }`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseKickoffAt(localDate: string, stadiumId: string): Date {
  const [datePart, timePart] = localDate.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const offsetHours = STADIUM_UTC_OFFSET_HOURS[stadiumId] ?? -5;

  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute));
}

function mapStatus(finished: string, timeElapsed: string): string {
  if (finished.toUpperCase() === "TRUE") {
    return "FT";
  }

  const elapsed = timeElapsed.toLowerCase();

  if (elapsed === "notstarted") {
    return "NS";
  }
  if (elapsed === "ht" || elapsed === "halftime") {
    return "HT";
  }
  if (elapsed === "1h" || elapsed === "firsthalf") {
    return "1H";
  }
  if (elapsed === "2h" || elapsed === "secondhalf") {
    return "2H";
  }
  if (elapsed === "live" || elapsed === "inprogress") {
    return "LIVE";
  }

  const minutes = Number.parseInt(timeElapsed, 10);

  if (!Number.isNaN(minutes)) {
    if (minutes <= 45) {
      return "1H";
    }
    if (minutes <= 90) {
      return "2H";
    }
    return "ET";
  }

  return "NS";
}

function parseScore(value: string, status: string): number | null {
  if (status === "NS") {
    return null;
  }

  const score = Number.parseInt(value, 10);
  return Number.isNaN(score) ? null : score;
}

function mapStage(type: string, group: string): string {
  switch (type) {
    case "group":
      return "Group Stage";
    case "r32":
      return "Round of 32";
    case "r16":
      return "Round of 16";
    case "qf":
      return "Quarter-final";
    case "sf":
      return "Semi-final";
    case "third":
      return "Third Place";
    case "final":
      return "Final";
    default:
      return group;
  }
}

function mapRound(type: string, group: string, matchday: string): string {
  if (type === "group") {
    return `Group ${group} - Matchday ${matchday}`;
  }
  return group;
}

function teamName(
  game: WorldCupGameRaw,
  side: "home" | "away",
  teamFlags: Map<string, string>,
): { name: string; logo: string | null } {
  const id = side === "home" ? game.home_team_id : game.away_team_id;
  const label =
    side === "home" ? game.home_team_label : game.away_team_label;
  const nameEn =
    side === "home" ? game.home_team_name_en : game.away_team_name_en;

  if (id !== "0" && nameEn) {
    return { name: nameEn, logo: teamFlags.get(id) ?? null };
  }

  if (label) {
    return { name: label, logo: null };
  }

  return { name: "TBD", logo: null };
}

function mapGame(game: WorldCupGameRaw, teamFlags: Map<string, string>): MatchFixture {
  const status = mapStatus(game.finished, game.time_elapsed);
  const home = teamName(game, "home", teamFlags);
  const away = teamName(game, "away", teamFlags);

  return {
    id: Number.parseInt(game.id, 10),
    homeTeamName: home.name,
    awayTeamName: away.name,
    homeTeamLogo: home.logo,
    awayTeamLogo: away.logo,
    kickoffAt: parseKickoffAt(game.local_date, game.stadium_id),
    status,
    homeScore: parseScore(game.home_score, status),
    awayScore: parseScore(game.away_score, status),
    stage: mapStage(game.type, game.group),
    round: mapRound(game.type, game.group, game.matchday),
  };
}

async function fetchTeamFlags(): Promise<Map<string, string>> {
  const { teams } = await fetchJson<TeamsResponse>("/get/teams");
  return new Map(teams.map((team) => [team.id, team.flag]));
}

export async function fetchWorldCupFixtures(): Promise<{
  fixtures: MatchFixture[];
  requestsUsed: number;
}> {
  const [{ games }, teamFlags] = await Promise.all([
    fetchJson<GamesResponse>("/get/games"),
    fetchTeamFlags(),
  ]);

  return {
    fixtures: games.map((game) => mapGame(game, teamFlags)),
    requestsUsed: 2,
  };
}

export async function fetchFixturesByIds(ids: number[]): Promise<{
  fixtures: MatchFixture[];
  requestsUsed: number;
}> {
  if (ids.length === 0) {
    return { fixtures: [], requestsUsed: 0 };
  }

  const { fixtures, requestsUsed } = await fetchWorldCupFixtures();
  const idSet = new Set(ids);

  return {
    fixtures: fixtures.filter((fixture) => idSet.has(fixture.id)),
    requestsUsed,
  };
}
