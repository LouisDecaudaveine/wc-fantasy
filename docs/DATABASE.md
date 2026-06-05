# Database

Turso (libSQL/SQLite) with Drizzle ORM. All timestamps stored as ISO 8601 strings or Unix integers (Drizzle `integer` with `{ mode: 'timestamp' }`).

## Tables

### `users`

Auth.js-compatible user table.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `email` | TEXT UNIQUE NOT NULL | Login identifier |
| `name` | TEXT NOT NULL | Display name on leaderboard |
| `password_hash` | TEXT NOT NULL | bcrypt hash |
| `created_at` | INTEGER NOT NULL | Unix timestamp |

### `matches`

Synced from worldcup26.ir. Source of truth for fixtures and results.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `external_fixture_id` | INTEGER UNIQUE NOT NULL | worldcup26.ir match `id` (1–104) |
| `home_team_name` | TEXT NOT NULL | |
| `away_team_name` | TEXT NOT NULL | |
| `home_team_logo` | TEXT | Flag URL from worldcup26.ir (flagcdn.com) |
| `away_team_logo` | TEXT | Optional crest URL |
| `kickoff_at` | INTEGER NOT NULL | Unix timestamp UTC |
| `status` | TEXT NOT NULL | `NS`, `1H`, `HT`, `2H`, `FT`, `PST`, `CANC`, etc. |
| `home_score` | INTEGER | Null until known |
| `away_score` | INTEGER | Null until known |
| `stage` | TEXT NOT NULL | e.g. `"Group Stage"`, `"Round of 32"` |
| `round` | TEXT | e.g. `"Group A - Matchday 1"` |
| `predictions_locked_at` | INTEGER NOT NULL | Equals `kickoff_at` |
| `updated_at` | INTEGER NOT NULL | Last sync time |

**Indexes:** `kickoff_at`, `status`, `external_fixture_id` (unique).

### `predictions`

One prediction per user per match.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK → users.id NOT NULL | |
| `match_id` | TEXT FK → matches.id NOT NULL | |
| `home_score` | INTEGER NOT NULL | Predicted home goals (0–20) |
| `away_score` | INTEGER NOT NULL | Predicted away goals (0–20) |
| `points_earned` | INTEGER NOT NULL DEFAULT 0 | Set when match finishes |
| `created_at` | INTEGER NOT NULL | |
| `updated_at` | INTEGER NOT NULL | |

**Constraints:** `UNIQUE(user_id, match_id)`

**Indexes:** `user_id`, `match_id`, `points_earned`

### `sync_log`

Audit trail for worldcup26.ir sync jobs.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `type` | TEXT NOT NULL | `bootstrap`, `daily`, `live` |
| `requests_used` | INTEGER NOT NULL DEFAULT 0 | |
| `status` | TEXT NOT NULL | `success`, `error` |
| `message` | TEXT | Error detail or summary |
| `ran_at` | INTEGER NOT NULL | |

## Drizzle Schema Location

[`lib/db/schema.ts`](../lib/db/schema.ts)

## Migrations

```bash
npm run db:generate   # generate migration from schema changes
npm run db:push       # push schema to Turso (dev)
npm run db:studio     # open Drizzle Studio
```

Production: run `db:push` or apply migrations via CI before deploy.

## Leaderboard Query

No dedicated table. Computed at query time:

```sql
SELECT
  u.id,
  u.name,
  COALESCE(SUM(p.points_earned), 0) AS total_points,
  COUNT(p.id) AS predictions_made
FROM users u
LEFT JOIN predictions p ON p.user_id = u.id
GROUP BY u.id
ORDER BY total_points DESC, predictions_made DESC, u.name ASC;
```

## Local Development

For local dev without Turso, set `TURSO_DATABASE_URL=file:local.db` and omit `TURSO_AUTH_TOKEN`. The libSQL client supports local file mode.
