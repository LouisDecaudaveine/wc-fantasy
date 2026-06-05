import { and, eq } from "drizzle-orm";

import { apiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { matches, predictions } from "@/lib/db/schema";
import { serializeMatch } from "@/lib/matches/serialize";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await requireSession();

  if (!session?.user?.id) {
    return apiError("Sign in required", "UNAUTHORIZED");
  }

  const { id } = await params;

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, id),
  });

  if (!match) {
    return apiError("Match not found", "NOT_FOUND");
  }

  const userPrediction = await db.query.predictions.findFirst({
    where: and(
      eq(predictions.userId, session.user.id),
      eq(predictions.matchId, id),
    ),
  });

  return Response.json(serializeMatch(match, userPrediction));
}
