import { eq, inArray } from "drizzle-orm";

import type { MatchFixture } from "@/lib/api-football/client";
import { db } from "@/lib/db";
import { matches, predictions } from "@/lib/db/schema";
import { FINISHED_STATUSES } from "@/lib/matches/filters";

import { calculatePoints } from "./calculate-points";

const ZERO_POINT_STATUSES = ["CANC"] as const;

function isScorableMatch(
  status: string,
  homeScore: number | null,
  awayScore: number | null,
): boolean {
  if (ZERO_POINT_STATUSES.includes(status as (typeof ZERO_POINT_STATUSES)[number])) {
    return true;
  }

  if (!FINISHED_STATUSES.includes(status as (typeof FINISHED_STATUSES)[number])) {
    return false;
  }

  return homeScore !== null && awayScore !== null;
}

export async function scorePredictionsForMatch(match: {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}): Promise<number> {
  if (!isScorableMatch(match.status, match.homeScore, match.awayScore)) {
    return 0;
  }

  const matchPredictions = await db.query.predictions.findMany({
    where: eq(predictions.matchId, match.id),
  });

  if (matchPredictions.length === 0) {
    return 0;
  }

  let updated = 0;
  const now = new Date();

  for (const prediction of matchPredictions) {
    const points =
      match.status === "CANC" ||
      match.homeScore === null ||
      match.awayScore === null
        ? 0
        : calculatePoints(
            { home: prediction.homeScore, away: prediction.awayScore },
            { home: match.homeScore, away: match.awayScore },
          );

    if (prediction.pointsEarned !== points) {
      await db
        .update(predictions)
        .set({ pointsEarned: points, updatedAt: now })
        .where(eq(predictions.id, prediction.id));
      updated++;
    }
  }

  return updated;
}

export async function scorePredictionsForFixtures(
  fixtures: MatchFixture[],
): Promise<number> {
  const scorableExternalIds = fixtures
    .filter((fixture) =>
      isScorableMatch(fixture.status, fixture.homeScore, fixture.awayScore),
    )
    .map((fixture) => fixture.id);

  if (scorableExternalIds.length === 0) {
    return 0;
  }

  const dbMatches = await db.query.matches.findMany({
    where: inArray(matches.externalFixtureId, scorableExternalIds),
  });

  let totalScored = 0;

  for (const match of dbMatches) {
    totalScored += await scorePredictionsForMatch(match);
  }

  return totalScored;
}
