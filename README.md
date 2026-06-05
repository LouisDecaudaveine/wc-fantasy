# WC Fantasy

World Cup 2026 fantasy league for friends — predict match scores, earn points, climb the leaderboard.

## Quickstart

```bash
npm install
cp .env.example .env.local
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/matches`.

## Documentation

Implementation docs live in [`docs/`](./docs/README.md):

- [Architecture](./docs/ARCHITECTURE.md)
- [Database schema](./docs/DATABASE.md)
- [REST API](./docs/API.md)
- [Scoring rules](./docs/SCORING.md)
- [Phased rollout](./docs/PHASES.md)
- [Deployment](./docs/DEPLOYMENT.md)

## Stack

Next.js App Router · Tailwind · shadcn/ui · TanStack Query · Drizzle · Turso · Auth.js · worldcup26.ir · Vercel

## Current status

**Phase 2 complete** — tap a match to predict scores before kickoff; predictions lock at kickoff. Next up: Phase 3 (scoring + leaderboard).
