# World Cup Fantasy — Phased Implementation Plan

See also the detailed docs index in [README.md](./README.md).

## Context

Target: **World Cup 2026** (104 fixtures via [worldcup26.ir](https://worldcup26.ir)), max **50 friends**, **mobile-first**.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router |
| UI | Tailwind + shadcn/ui |
| Data fetching | TanStack Query |
| DB | Turso (libSQL/SQLite) + Drizzle ORM |
| Auth | Auth.js v5 (credentials + bcrypt) |
| External data | worldcup26.ir |
| Deploy | Vercel + Vercel Cron |

## Scoring Model

Users predict home and away goals. Points are additive per match:

| Rule | Points |
|---|---|
| Correct outcome | 3 |
| Exact scoreline | 5 |
| Correct home team goals | 1 |
| Correct away team goals | 1 |
| **Max per match** | **10** |

## Phases

| Phase | Focus | Status |
|---|---|---|
| 0 | Docs + scaffold | Complete |
| 1 | Auth + worldcup26.ir match sync | Complete |
| 2 | Predictions with kickoff lock | Complete |
| 3 | Scoring engine + leaderboard | Next |
| 4 | Polish + production deploy | Pending |

Full acceptance criteria: [PHASES.md](./PHASES.md).

## Post-MVP Backlog

- Push notifications for lock reminders
- Head-to-head friend comparison
- Group-stage mini-leagues
- Admin manual result override
- Exact-score streak bonuses
- PWA install prompt
