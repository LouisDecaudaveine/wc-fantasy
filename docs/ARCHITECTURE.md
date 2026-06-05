# Architecture

## Overview

Single Next.js application deployed on Vercel. All user-facing pages and REST API routes live in one repo. Match data is synced from [worldcup26.ir](https://worldcup26.ir) into Turso via cron jobs — user requests never hit the external API directly.

```mermaid
flowchart TB
  subgraph client [Mobile Web Client]
    UI[Next.js Pages]
    RQ[TanStack Query]
  end

  subgraph vercel [Vercel]
    API[REST Route Handlers]
    Cron[Vercel Cron]
    Auth[Auth.js Session]
  end

  subgraph external [External]
    WC26[worldcup26.ir]
  end

  subgraph data [Data]
    Turso[(Turso SQLite)]
  end

  UI --> RQ --> API
  API --> Auth
  API --> Turso
  Cron --> API
  API --> WC26
```

## Folder Structure

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
    layout.tsx
  (app)/
    matches/page.tsx
    leaderboard/page.tsx
    layout.tsx          # bottom nav shell
  api/
    auth/[...nextauth]/route.ts
    auth/register/route.ts
    matches/route.ts
    matches/[id]/route.ts
    predictions/[matchId]/route.ts
    leaderboard/route.ts
    me/route.ts
    cron/sync-matches/route.ts
  layout.tsx            # root layout + providers
  page.tsx              # redirect to /matches

components/
  ui/                   # shadcn components
  app/                  # app-specific components
    bottom-nav.tsx
    match-card.tsx
    providers.tsx

lib/
  db/
    index.ts            # Drizzle client
    schema.ts           # table definitions
  auth/
    config.ts           # Auth.js config
    session.ts          # getServerSession helper
  scoring/
    calculate-points.ts
    config.ts
  api-football/           # worldcup26.ir client (legacy folder name)
    client.ts
    sync.ts
  validations/
    auth.ts
    predictions.ts

docs/                   # this folder
drizzle/                # generated migrations
```

## Auth Flow

1. User registers at `/register` with email, password, name, and invite code.
2. `POST /api/auth/register` validates invite code, hashes password, inserts user.
3. User logs in at `/login` via Auth.js credentials provider.
4. Session stored in HTTP-only cookie; middleware protects `(app)` routes in Phase 4.

```mermaid
sequenceDiagram
  participant User
  participant UI
  participant API
  participant DB

  User->>UI: Register with invite code
  UI->>API: POST /api/auth/register
  API->>DB: INSERT user
  User->>UI: Login
  UI->>API: POST /api/auth/callback/credentials
  API->>DB: Verify password
  API-->>UI: Set session cookie
```

## Match Sync Flow

All worldcup26.ir calls happen in the cron sync job, not in user-facing routes.

```mermaid
sequenceDiagram
  participant Cron
  participant API
  participant WC26 as worldcup26.ir
  participant DB

  Cron->>API: POST /api/cron/sync-matches
  API->>WC26: GET /get/games
  API->>WC26: GET /get/teams
  WC26-->>API: fixtures + scores + flags
  API->>DB: UPSERT matches
  API->>DB: Score finished predictions
  API->>DB: INSERT sync_log
```

### Sync Strategy

| Trigger | Requests | Action |
|---|---|---|
| Bootstrap (manual) | 2 | Fetch all 104 WC 2026 fixtures + team flags |
| Daily cron | 2 | Refresh upcoming match metadata |
| Match-day live sync (15 min, Phase 5) | 2 | Update live/finished scores, run scoring — external cron or Vercel Pro |

Fixtures are cached in the `matches` table. The matches API reads from Turso only.

## Mobile-First UI

- Max-width container (`max-w-md`) centered on larger screens
- Bottom tab navigation: Matches | Leaderboard
- Minimum 44px tap targets
- Sheet component for match prediction detail
- Sticky header with app title

## Error Handling

All API routes return JSON:

```json
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

Common codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `PREDICTION_LOCKED`, `INVITE_INVALID`.
