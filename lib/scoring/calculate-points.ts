import { scoringConfig } from "./config";

export type Score = {
  home: number;
  away: number;
};

type Outcome = "home" | "draw" | "away";

function getOutcome(home: number, away: number): Outcome {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function calculatePoints(
  prediction: Score,
  actual: Score,
  config = scoringConfig,
): number {
  let points = 0;

  if (getOutcome(prediction.home, prediction.away) === getOutcome(actual.home, actual.away)) {
    points += config.outcomePoints;
  }

  if (prediction.home === actual.home && prediction.away === actual.away) {
    points += config.exactPoints;
  }

  if (prediction.home === actual.home) {
    points += config.homeGoalsPoints;
  }

  if (prediction.away === actual.away) {
    points += config.awayGoalsPoints;
  }

  return points;
}
