import { randomUUID } from "crypto";

import { and, eq } from "drizzle-orm";

import { apiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { matches, predictions } from "@/lib/db/schema";
import { isPredictionEditable } from "@/lib/matches/prediction-state";
import { serializePrediction } from "@/lib/matches/serialize";
import { predictionSchema } from "@/lib/validations/predictions";

type RouteParams = {
  params: Promise<{ matchId: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await requireSession();

  if (!session?.user?.id) {
    return apiError("Sign in required", "UNAUTHORIZED");
  }

  const { matchId } = await params;

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });

  if (!match) {
    return apiError("Match not found", "NOT_FOUND");
  }

  if (
    !isPredictionEditable({
      kickoffAt: match.kickoffAt.toISOString(),
      predictionsLockedAt: match.predictionsLockedAt.toISOString(),
      status: match.status,
    })
  ) {
    return apiError("Predictions are locked for this match", "PREDICTION_LOCKED");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR");
  }

  const parsed = predictionSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid prediction scores", "VALIDATION_ERROR");
  }

  const { homeScore, awayScore } = parsed.data;
  const userId = session.user.id;
  const now = new Date();

  const existing = await db.query.predictions.findFirst({
    where: and(
      eq(predictions.userId, userId),
      eq(predictions.matchId, matchId),
    ),
  });

  if (existing) {
    await db
      .update(predictions)
      .set({
        homeScore,
        awayScore,
        updatedAt: now,
      })
      .where(eq(predictions.id, existing.id));

    return Response.json({
      ...serializePrediction({ ...existing, homeScore, awayScore, updatedAt: now }),
      matchId,
    });
  }

  const id = randomUUID();

  const created = {
    id,
    userId,
    matchId,
    homeScore,
    awayScore,
    pointsEarned: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(predictions).values(created);

  return Response.json({
    ...serializePrediction(created),
    matchId,
  });
}
