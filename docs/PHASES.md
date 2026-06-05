# Implementation Phases

Each phase is independently deployable. Complete phases in order.

---

## Phase 0 — Docs + Scaffold

**Goal:** Runnable app skeleton + all docs committed.

### Tasks

- [x] Write `docs/` folder
- [x] Init Next.js (App Router, TS, Tailwind, ESLint)
- [x] Add shadcn/ui (Button, Card, Input, Sheet, Tabs, Avatar, Badge)
- [x] Add Drizzle + Turso client, Auth.js, TanStack Query provider
- [x] Define `.env.example`
- [x] App shell with bottom nav (Matches, Leaderboard)
- [x] Placeholder auth pages (`/login`, `/register`)

### File Checklist

```
app/(auth)/login/page.tsx
app/(auth)/register/page.tsx
app/(auth)/layout.tsx
app/(app)/matches/page.tsx
app/(app)/leaderboard/page.tsx
app/(app)/layout.tsx
components/app/bottom-nav.tsx
components/app/providers.tsx
lib/db/schema.ts
lib/db/index.ts
lib/auth/config.ts
lib/scoring/calculate-points.ts
lib/scoring/config.ts
lib/api-football/client.ts (worldcup26.ir client)
.env.example
drizzle.config.ts
```

### Acceptance Criteria

- [x] `npm run dev` starts without errors
- [x] Mobile shell renders with bottom nav at `/matches` and `/leaderboard`
- [x] Root redirects to `/matches`
- [x] Drizzle schema defined; `npm run db:push` succeeds against local or Turso DB
- [x] All docs present in `docs/`

---

## Phase 1 — Auth + Match Sync

**Goal:** Friends can register/login; matches appear from worldcup26.ir.

### Tasks

- [x] Auth.js credentials provider + register route with invite code
- [x] Drizzle migrations applied for all tables
- [x] worldcup26.ir client: bootstrap fixtures + cron sync route
- [x] `GET /api/matches` with status filter
- [x] Matches page: cards grouped by stage
- [x] Vercel Cron config (`vercel.json`)

### Acceptance Criteria

- [x] Register 2 test users with invite code
- [x] Login/logout works (credentials via Auth.js + sign-in forms)
- [x] Manual or cron sync populates WC 2026 fixtures (104 matches, no API key)
- [x] Matches page shows upcoming games on mobile (once synced)

---

## Phase 2 — Predictions

**Goal:** Users submit score predictions before kickoff.

### Tasks

- [x] `PUT /api/predictions/[matchId]` with Zod validation + kickoff lock
- [x] TanStack Query mutations with optimistic UI
- [x] Match detail sheet with score pickers
- [x] Visual states: open, locked, scored

### Acceptance Criteria

- [x] User can create and edit prediction before kickoff
- [x] Edit blocked after kickoff (423 response)
- [x] One prediction per user per match enforced

---

## Phase 3 — Scoring + Leaderboard

**Goal:** Points auto-calculate when matches finish.

### Tasks

- [x] Scoring engine wired into sync job
- [x] `GET /api/leaderboard` + Leaderboard UI
- [x] `GET /api/me` profile stats

### Acceptance Criteria

- [x] Finished match triggers correct point calculation
- [x] Leaderboard ranks users by total points
- [x] Current user highlighted on leaderboard

---

## Phase 4 — Polish + Deploy

**Goal:** Production-ready for friends.

### Tasks

- [x] Auth middleware protecting `(app)` routes
- [x] Loading/error/empty states
- [x] Edge cases: postponed matches, API failures
- [ ] Deploy to Vercel with Turso prod DB + cron (manual — see `docs/DEPLOYMENT.md`)

### Acceptance Criteria

- [x] Unauthenticated users redirected to `/login`
- [ ] App live on Vercel (manual deploy)
- [ ] Full match cycle tested on mobile device (manual QA)

---

## Post-MVP Backlog

- Push notifications for lock reminders
- Head-to-head friend comparison
- Group-stage mini-leagues
- Admin manual result override
- Exact-score streak bonuses
- PWA install prompt
