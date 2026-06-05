import { apiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { getUserStats } from "@/lib/leaderboard/stats";

export async function GET() {
  const session = await requireSession();

  if (!session?.user?.id) {
    return apiError("Sign in required", "UNAUTHORIZED");
  }

  const profile = await getUserStats(session.user.id);

  if (!profile) {
    return apiError("User not found", "NOT_FOUND");
  }

  return Response.json({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    totalPoints: profile.totalPoints,
    rank: profile.rank,
    predictionsMade: profile.predictionsMade,
  });
}
