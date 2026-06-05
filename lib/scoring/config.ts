export const scoringConfig = {
  outcomePoints: Number(process.env.SCORING_OUTCOME_POINTS ?? 3),
  exactPoints: Number(process.env.SCORING_EXACT_POINTS ?? 5),
  homeGoalsPoints: Number(process.env.SCORING_HOME_GOALS_POINTS ?? 1),
  awayGoalsPoints: Number(process.env.SCORING_AWAY_GOALS_POINTS ?? 1),
} as const;
