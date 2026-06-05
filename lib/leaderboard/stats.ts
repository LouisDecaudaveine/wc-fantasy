import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { predictions, users } from "@/lib/db/schema";

export type UserStatsRow = {
  userId: string;
  name: string;
  totalPoints: number;
  predictionsMade: number;
};

export type LeaderboardEntry = UserStatsRow & {
  rank: number;
};

function assignRanks(rows: UserStatsRow[]): LeaderboardEntry[] {
  let rank = 0;

  return rows.map((row, index) => {
    if (index === 0 || row.totalPoints < rows[index - 1].totalPoints) {
      rank = index + 1;
    }

    return { ...row, rank };
  });
}

export async function getUserStatsRows(): Promise<UserStatsRow[]> {
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      totalPoints: sql<number>`coalesce(sum(${predictions.pointsEarned}), 0)`,
      predictionsMade: sql<number>`count(${predictions.id})`,
    })
    .from(users)
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .groupBy(users.id)
    .orderBy(
      desc(sql`coalesce(sum(${predictions.pointsEarned}), 0)`),
      users.name,
    );

  return rows.map((row) => ({
    userId: row.userId,
    name: row.name,
    totalPoints: Number(row.totalPoints),
    predictionsMade: Number(row.predictionsMade),
  }));
}

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  return assignRanks(await getUserStatsRows());
}

export async function getUserStats(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    return null;
  }

  const rows = await getUserStatsRows();
  const stats = rows.find((row) => row.userId === userId);
  const entries = assignRanks(rows);
  const rank = entries.find((entry) => entry.userId === userId)?.rank ?? null;

  return {
    ...user,
    totalPoints: stats?.totalPoints ?? 0,
    predictionsMade: stats?.predictionsMade ?? 0,
    rank,
  };
}
