# WC Fantasy — Implementation Docs

A private World Cup 2026 fantasy league for up to 50 friends. Predict match scores, earn points, climb the leaderboard.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15+ App Router |
| UI | Tailwind CSS + shadcn/ui |
| Data fetching | TanStack Query |
| Database | Turso (libSQL/SQLite) + Drizzle ORM |
| Auth | Auth.js v5 (credentials) |
| Match data | [worldcup26.ir](https://worldcup26.ir) (free, no API key) |
| Deploy | Vercel + Vercel Cron |

## Docs Index

| Doc | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flows, folder structure |
| [DATABASE.md](./DATABASE.md) | Schema, Drizzle models, migrations |
| [API.md](./API.md) | REST endpoints, request/response shapes |
| [SCORING.md](./SCORING.md) | Points rules and worked examples |
| [PHASES.md](./PHASES.md) | Phased rollout with acceptance criteria |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel, Turso, cron, env vars |

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill in values
npm run db:push              # apply schema to Turso or local.db
npm run dev                  # http://localhost:3000
```

## Scoring (summary)

Users predict home and away goals. Points are additive per match:

- **+3** correct outcome (win/draw/loss)
- **+5** exact scoreline
- **+1** correct home team goals
- **+1** correct away team goals

Max **10 points** per match. See [SCORING.md](./SCORING.md) for examples.

## Phases

| Phase | Focus |
|---|---|
| 0 | Docs + scaffold (this repo foundation) |
| 1 | Auth + worldcup26.ir match sync |
| 2 | Predictions with kickoff lock |
| 3 | Scoring engine + leaderboard |
| 4 | Polish + production deploy |

See [PHASES.md](./PHASES.md) for full acceptance criteria.
