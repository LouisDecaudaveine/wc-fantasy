# Scoring Rules

Users predict **home score** and **away score** for each match. Points are calculated when a match reaches `FT` (full time) status.

## Point Values (defaults)

| Rule | Points | Env override |
|---|---|---|
| Correct outcome (win/draw/loss) | 3 | `SCORING_OUTCOME_POINTS` |
| Exact scoreline | 5 | `SCORING_EXACT_POINTS` |
| Correct home team goals | 1 | `SCORING_HOME_GOALS_POINTS` |
| Correct away team goals | 1 | `SCORING_AWAY_GOALS_POINTS` |

**Maximum per match: 10 points** (all four rules satisfied).

Points are **additive** — a perfect prediction earns all applicable bonuses.

## Outcome Logic

```typescript
function getOutcome(home: number, away: number): 'home' | 'draw' | 'away' {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}
```

Outcome points awarded when predicted outcome matches actual outcome.

## Worked Examples

### Perfect prediction

| | Home | Away |
|---|---|---|
| Predicted | 2 | 1 |
| Actual | 2 | 1 |

- Outcome: home win ✓ → +3
- Exact score ✓ → +5
- Home goals ✓ → +1
- Away goals ✓ → +1
- **Total: 10**

### Correct winner, wrong score

| | Home | Away |
|---|---|---|
| Predicted | 2 | 1 |
| Actual | 3 | 1 |

- Outcome: home win ✓ → +3
- Exact score ✗
- Home goals ✗ (2 vs 3)
- Away goals ✓ → +1
- **Total: 4**

### Draw predicted correctly, wrong goals

| | Home | Away |
|---|---|---|
| Predicted | 1 | 1 |
| Actual | 0 | 0 |

- Outcome: draw ✓ → +3
- Exact score ✗
- Home goals ✗
- Away goals ✗
- **Total: 3**

### Wrong winner

| | Home | Away |
|---|---|---|
| Predicted | 2 | 0 |
| Actual | 1 | 2 |

- Outcome ✗
- Exact score ✗
- Home goals ✗
- Away goals ✗
- **Total: 0**

### Correct goals but wrong winner (impossible)

If home goals and away goals are both correct, outcome and exact score are automatically correct too. Max 10 always holds.

## When Scoring Runs

1. Cron sync detects match `status === 'FT'` with final scores.
2. Match row updated with `home_score`, `away_score`.
3. All predictions for that match loaded.
4. `calculatePoints()` run for each; `points_earned` updated.
5. Idempotent: re-running on already-scored match overwrites same values.

## Edge Cases

| Scenario | MVP behaviour |
|---|---|
| Postponed (`PST`) | No scoring; predictions remain editable until new kickoff (sync updates `kickoff_at`) |
| Cancelled (`CANC`) | No scoring; predictions ignored (0 points) |
| Abandoned | Wait for API final status; if never `FT`, no scoring |
| Extra time / penalties | Use regulation-time scores as returned by worldcup26.ir sync |
| Match re-sync with corrected score | Re-score all predictions (overwrite `points_earned`) |

## Implementation

[`lib/scoring/calculate-points.ts`](../lib/scoring/calculate-points.ts)

[`lib/scoring/config.ts`](../lib/scoring/config.ts) — reads point values from env with defaults above.
