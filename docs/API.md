# REST API

Base URL: `/api`. All responses are JSON. Authenticated routes require a valid Auth.js session cookie unless noted.

## Error Format

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_CODE"
}
```

| HTTP Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request body or params |
| 401 | `UNAUTHORIZED` | Missing or invalid session |
| 403 | `FORBIDDEN` | Valid session but not allowed (e.g. wrong invite code) |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate email on register |
| 423 | `PREDICTION_LOCKED` | Kickoff passed, prediction cannot change |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Auth

### `POST /api/auth/register`

Create a new account. Public; requires valid invite code.

**Body:**

```json
{
  "email": "friend@example.com",
  "password": "min8chars",
  "name": "Alex",
  "inviteCode": "wc2026-friends"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "email": "friend@example.com",
  "name": "Alex"
}
```

### `POST /api/auth/[...nextauth]`

Auth.js handlers (login, logout, session). Managed by NextAuth — see Auth.js docs for callback URLs.

---

## Matches

### `GET /api/matches`

List matches from DB cache.

**Query params:**

| Param | Values | Default |
|---|---|---|
| `status` | `upcoming`, `live`, `finished`, `all` | `upcoming` |

**Response `200`:**

```json
{
  "matches": [
    {
      "id": "uuid",
      "homeTeamName": "Brazil",
      "awayTeamName": "France",
      "homeTeamLogo": "https://...",
      "awayTeamLogo": "https://...",
      "kickoffAt": "2026-06-15T18:00:00.000Z",
      "status": "NS",
      "homeScore": null,
      "awayScore": null,
      "stage": "Group stage - Group D",
      "predictionsLockedAt": "2026-06-15T18:00:00.000Z",
      "userPrediction": null
    }
  ]
}
```

When authenticated, each match includes `userPrediction` if one exists.

### `GET /api/matches/[id]`

Single match with user's prediction.

**Response `200`:** Same match object as above, plus full prediction detail.

---

## Predictions

### `PUT /api/predictions/[matchId]`

Create or update prediction. Blocked after kickoff.

**Body:**

```json
{
  "homeScore": 2,
  "awayScore": 1
}
```

Validation: integers 0–20.

**Response `200`:**

```json
{
  "id": "uuid",
  "matchId": "uuid",
  "homeScore": 2,
  "awayScore": 1,
  "pointsEarned": 0,
  "updatedAt": "2026-06-14T10:00:00.000Z"
}
```

---

## Leaderboard

### `GET /api/leaderboard`

**Response `200`:**

```json
{
  "entries": [
    {
      "rank": 1,
      "userId": "uuid",
      "name": "Alex",
      "totalPoints": 42,
      "predictionsMade": 12
    }
  ],
  "currentUserRank": 3
}
```

---

## Profile

### `GET /api/me`

Current user profile and stats.

**Response `200`:**

```json
{
  "id": "uuid",
  "email": "friend@example.com",
  "name": "Alex",
  "totalPoints": 42,
  "rank": 3,
  "predictionsMade": 12
}
```

---

## Cron (internal)

### `POST /api/cron/sync-matches`

Trigger fixture/score sync. Protected by `Authorization: Bearer $CRON_SECRET`.

**Response `200`:**

```json
{
  "synced": 104,
  "scored": 3,
  "requestsUsed": 2
}
```

Not called by the client. Invoked by Vercel Cron only.
