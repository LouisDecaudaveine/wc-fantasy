import type { matches, predictions } from "@/lib/db/schema";

type MatchRow = typeof matches.$inferSelect;
type PredictionRow = typeof predictions.$inferSelect;

export type SerializedPrediction = {
  id: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number;
  updatedAt: string;
};

export type SerializedMatch = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  kickoffAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  stage: string;
  round: string | null;
  predictionsLockedAt: string;
  userPrediction: SerializedPrediction | null;
};

export function serializePrediction(
  prediction: PredictionRow,
): SerializedPrediction {
  return {
    id: prediction.id,
    homeScore: prediction.homeScore,
    awayScore: prediction.awayScore,
    pointsEarned: prediction.pointsEarned,
    updatedAt: prediction.updatedAt.toISOString(),
  };
}

export function serializeMatch(
  match: MatchRow,
  userPrediction?: PredictionRow | null,
): SerializedMatch {
  return {
    id: match.id,
    homeTeamName: match.homeTeamName,
    awayTeamName: match.awayTeamName,
    homeTeamLogo: match.homeTeamLogo,
    awayTeamLogo: match.awayTeamLogo,
    kickoffAt: match.kickoffAt.toISOString(),
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    stage: match.stage,
    round: match.round,
    predictionsLockedAt: match.predictionsLockedAt.toISOString(),
    userPrediction: userPrediction
      ? serializePrediction(userPrediction)
      : null,
  };
}
