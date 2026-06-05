import { apiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { getLeaderboardEntries } from "@/lib/leaderboard/stats";

export async function GET() {
  const session = await requireSession();

  if (!session?.user?.id) {
    return apiError("Sign in required", "UNAUTHORIZED");
  }

  const entries = await getLeaderboardEntries();
  const currentUserRank =
    entries.find((entry) => entry.userId === session.user.id)?.rank ?? null;

  return Response.json({
    entries: entries.map((entry) => ({
      rank: entry.rank,
      userId: entry.userId,
      name: entry.name,
      totalPoints: entry.totalPoints,
      predictionsMade: entry.predictionsMade,
    })),
    currentUserRank,
  });
}
