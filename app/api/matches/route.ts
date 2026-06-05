import { and, asc, eq, inArray } from "drizzle-orm";

import { apiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { matches, predictions } from "@/lib/db/schema";
import {
  parseStatusFilter,
  statusesForFilter,
} from "@/lib/matches/filters";
import { serializeMatch } from "@/lib/matches/serialize";

export async function GET(request: Request) {
  const session = await requireSession();

  if (!session?.user?.id) {
    return apiError("Sign in required", "UNAUTHORIZED");
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = parseStatusFilter(searchParams.get("status"));
  const allowedStatuses = statusesForFilter(statusFilter);

  const rows =
    allowedStatuses === null
      ? await db.query.matches.findMany({
          orderBy: [asc(matches.kickoffAt)],
        })
      : await db.query.matches.findMany({
          where: inArray(matches.status, allowedStatuses),
          orderBy: [asc(matches.kickoffAt)],
        });

  const matchIds = rows.map((row) => row.id);
  const userPredictions =
    matchIds.length === 0
      ? []
      : await db.query.predictions.findMany({
          where: and(
            eq(predictions.userId, session.user.id),
            inArray(predictions.matchId, matchIds),
          ),
        });

  const predictionsByMatchId = new Map(
    userPredictions.map((prediction) => [prediction.matchId, prediction]),
  );

  return Response.json({
    matches: rows.map((row) =>
      serializeMatch(row, predictionsByMatchId.get(row.id)),
    ),
  });
}
