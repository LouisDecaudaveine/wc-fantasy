import { randomUUID } from "crypto";

import { and, eq, gte, inArray, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { matches, syncLog } from "@/lib/db/schema";
import { FINISHED_STATUSES } from "@/lib/matches/filters";
import { scorePredictionsForFixtures } from "@/lib/scoring/score-predictions";

import {
  fetchFixturesByIds,
  fetchWorldCupFixtures,
  type MatchFixture,
} from "./client";

export type SyncType = "bootstrap" | "daily" | "live";

function resolveFixtureStatus(
  fixture: MatchFixture,
  existingKickoffAt: Date | null,
  existingStatus: string | null,
): string {
  if (
    existingKickoffAt &&
    existingStatus &&
    !FINISHED_STATUSES.includes(
      existingStatus as (typeof FINISHED_STATUSES)[number],
    ) &&
    fixture.status === "NS" &&
    existingKickoffAt.getTime() !== fixture.kickoffAt.getTime()
  ) {
    return "PST";
  }

  return fixture.status;
}

function mapFixtureToRow(
  fixture: MatchFixture,
  now: Date,
  status: string,
) {
  return {
    id: randomUUID(),
    externalFixtureId: fixture.id,
    homeTeamName: fixture.homeTeamName,
    awayTeamName: fixture.awayTeamName,
    homeTeamLogo: fixture.homeTeamLogo,
    awayTeamLogo: fixture.awayTeamLogo,
    kickoffAt: fixture.kickoffAt,
    status,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    stage: fixture.stage,
    round: fixture.round,
    predictionsLockedAt: fixture.kickoffAt,
    updatedAt: now,
  };
}

async function upsertFixtures(
  fixtures: MatchFixture[],
  now: Date,
): Promise<{ synced: number; scored: number }> {
  let synced = 0;

  for (const fixture of fixtures) {
    const existing = await db.query.matches.findFirst({
      where: eq(matches.externalFixtureId, fixture.id),
      columns: { kickoffAt: true, status: true },
    });

    const status = resolveFixtureStatus(
      fixture,
      existing?.kickoffAt ?? null,
      existing?.status ?? null,
    );
    const row = mapFixtureToRow(fixture, now, status);

    await db
      .insert(matches)
      .values(row)
      .onConflictDoUpdate({
        target: matches.externalFixtureId,
        set: {
          homeTeamName: row.homeTeamName,
          awayTeamName: row.awayTeamName,
          homeTeamLogo: row.homeTeamLogo,
          awayTeamLogo: row.awayTeamLogo,
          kickoffAt: row.kickoffAt,
          status: row.status,
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          stage: row.stage,
          round: row.round,
          predictionsLockedAt: row.predictionsLockedAt,
          updatedAt: row.updatedAt,
        },
      });

    synced++;
  }

  let scored = 0;

  try {
    scored = await scorePredictionsForFixtures(fixtures);
  } catch {
    // Fixtures are saved; scoring will retry on the next sync run.
  }

  return { synced, scored };
}

async function logSync(
  type: SyncType,
  requestsUsed: number,
  status: "success" | "error",
  message: string,
) {
  await db.insert(syncLog).values({
    id: randomUUID(),
    type,
    requestsUsed,
    status,
    message,
    ranAt: new Date(),
  });
}

export async function syncWorldCupFixtures(type: SyncType = "daily") {
  const now = new Date();

  try {
    const { fixtures, requestsUsed } = await fetchWorldCupFixtures();
    const { synced, scored } = await upsertFixtures(fixtures, now);

    await logSync(
      type,
      requestsUsed,
      "success",
      `Synced ${synced} fixtures, scored ${scored} predictions`,
    );

    return { synced, scored, requestsUsed };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error";

    await logSync(type, 0, "error", message);
    throw error;
  }
}

export async function syncLiveFixtures() {
  const now = new Date();
  const liveStatuses = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"];
  const recentFinishedStatuses = [...FINISHED_STATUSES];
  const kickoffWindowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  const candidates = await db.query.matches.findMany({
    where: or(
      inArray(matches.status, liveStatuses),
      and(
        inArray(matches.status, recentFinishedStatuses),
        gte(matches.kickoffAt, kickoffWindowStart),
      ),
    ),
    columns: { externalFixtureId: true },
  });

  const ids = candidates.map((match) => match.externalFixtureId);

  if (ids.length === 0) {
    await logSync("live", 0, "success", "No live fixtures to refresh");
    return { synced: 0, scored: 0, requestsUsed: 0 };
  }

  try {
    const { fixtures, requestsUsed } = await fetchFixturesByIds(ids);
    const { synced, scored } = await upsertFixtures(fixtures, now);

    await logSync(
      "live",
      requestsUsed,
      "success",
      `Refreshed ${synced} fixtures, scored ${scored} predictions`,
    );

    return { synced, scored, requestsUsed };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error";

    await logSync("live", 0, "error", message);
    throw error;
  }
}
