import { FINISHED_STATUSES, UPCOMING_STATUSES } from "@/lib/matches/filters";

export type PredictionState = "open" | "locked" | "scored";

export function getPredictionState(match: {
  kickoffAt: string;
  predictionsLockedAt: string;
  status: string;
}): PredictionState {
  if (FINISHED_STATUSES.includes(match.status as (typeof FINISHED_STATUSES)[number])) {
    return "scored";
  }

  const now = Date.now();

  if (now >= new Date(match.predictionsLockedAt).getTime()) {
    return "locked";
  }

  if (
    !UPCOMING_STATUSES.includes(match.status as (typeof UPCOMING_STATUSES)[number])
  ) {
    return "locked";
  }

  return "open";
}

export function isPredictionEditable(match: {
  kickoffAt: string;
  predictionsLockedAt: string;
  status: string;
}): boolean {
  return getPredictionState(match) === "open";
}
