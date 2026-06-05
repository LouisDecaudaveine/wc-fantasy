# Deployment

Target: Vercel + Turso + worldcup26.ir. Max ~50 users.

## Prerequisites

1. [Vercel](https://vercel.com) account
2. [Turso](https://turso.tech) database

Match data comes from [worldcup26.ir](https://worldcup26.ir) — a free, open-source World Cup 2026 API. No API key required.

## Environment Variables

Copy [`.env.example`](../.env.example) to `.env.local` for local dev.

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | Turso libSQL URL, or `file:local.db` for local |
| `TURSO_AUTH_TOKEN` | Turso cloud | Auth token (omit for local file) |
| `AUTH_SECRET` | Yes | Random string for Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` | Prod | Full app URL, e.g. `https://wc-fantasy.vercel.app` |
| `WORLDCUP26_API_BASE` | No | Default `https://worldcup26.ir` |
| `CRON_SECRET` | Yes | Bearer token for cron route |
| `INVITE_CODE` | Yes | Shared code friends use to register |
| `SCORING_OUTCOME_POINTS` | No | Default `3` |
| `SCORING_EXACT_POINTS` | No | Default `5` |
| `SCORING_HOME_GOALS_POINTS` | No | Default `1` |
| `SCORING_AWAY_GOALS_POINTS` | No | Default `1` |

## Turso Setup

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

turso auth login
turso db create wc-fantasy
turso db show wc-fantasy --url
turso db tokens create wc-fantasy
```

Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from the output.

Apply schema:

```bash
npm run db:push
```

## Vercel Setup

1. Push repo to GitHub
2. Import project in Vercel
3. Add all env vars from table above
4. Deploy

Build command: `npm run build`  
Install command: `npm install`

## Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-matches",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/sync-matches",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

During the tournament, the 15-minute job handles live/finished score updates. The daily job refreshes fixture metadata.

Cron requests must include:

```
Authorization: Bearer <CRON_SECRET>
```

Configure in Vercel Cron settings or use a middleware check in the route handler.

## Match Data Source

Fixtures and live scores are fetched from [worldcup26.ir](https://worldcup26.ir):

| Endpoint | Purpose |
|---|---|
| `GET /get/games` | All 104 tournament matches |
| `GET /get/teams` | Team names and flag URLs |

Sync design uses 2 requests per run (games + teams). Never call worldcup26.ir from user-facing routes — all data is cached in the `matches` table.

Bootstrap (one-time):

```
GET https://worldcup26.ir/get/games
GET https://worldcup26.ir/get/teams
```

Optional override via `WORLDCUP26_API_BASE` if self-hosting the API.

## Manual Bootstrap

After first deploy, trigger initial fixture load:

```bash
curl "https://your-app.vercel.app/api/cron/sync-matches?mode=bootstrap" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Vercel Cron invokes routes with **GET**. The sync route accepts both GET and POST. Set `CRON_SECRET` in Vercel env — Vercel sends it as `Authorization: Bearer <CRON_SECRET>` on cron requests.

## Local Development

```bash
cp .env.example .env.local
# Use file:local.db for TURSO_DATABASE_URL (no token needed)
npm install
npm run db:push
npm run dev
```

## Troubleshooting

| Issue | Fix |
|---|---|
| Auth session not persisting | Set `AUTH_URL` to exact production URL |
| Cron returns 401 | Verify `CRON_SECRET` matches env |
| No matches showing | Run bootstrap sync (`?mode=bootstrap`); verify worldcup26.ir is reachable |
| Predictions locked early | Verify server timezone; kickoff stored as UTC |
| Postponed match stuck | Re-sync updates `kickoff_at`; scoring waits for `FT` |

## Manual Score Override (emergency)

If worldcup26.ir is down, update match directly in Turso:

```sql
UPDATE matches
SET home_score = 2, away_score = 1, status = 'FT', updated_at = unixepoch()
WHERE external_fixture_id = 1;
```

Then trigger sync or re-run scoring logic manually (document in runbook as needed).
