import { apiError } from "@/lib/api/errors";
import {
  syncLiveFixtures,
  syncWorldCupFixtures,
  type SyncType,
} from "@/lib/api-football/sync";

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

async function handleSync(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("Unauthorized", "UNAUTHORIZED");
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const syncType: SyncType =
    mode === "bootstrap" ? "bootstrap" : mode === "live" ? "live" : "daily";

  try {
    const result =
      syncType === "live"
        ? await syncLiveFixtures()
        : await syncWorldCupFixtures(syncType);

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sync failed";

    return apiError(message, "INTERNAL_ERROR");
  }
}

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}
