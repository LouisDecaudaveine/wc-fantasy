import { randomUUID } from "crypto";

import { getEnv } from "@/lib/env";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause:
        error.cause instanceof Error
          ? error.cause.message
          : error.cause
            ? String(error.cause)
            : undefined,
    };
  }

  return { message: String(error) };
}

export function logEnvPresence(scope: string) {
  console.info(`[${scope}] env`, {
    vercel: Boolean(getEnv("VERCEL")),
    nodeEnv: process.env.NODE_ENV,
    hasTursoDatabaseUrl: Boolean(getEnv("TURSO_DATABASE_URL")),
    hasTursoAuthToken: Boolean(getEnv("TURSO_AUTH_TOKEN")),
    hasInviteCode: Boolean(getEnv("INVITE_CODE")),
    hasAuthSecret: Boolean(getEnv("AUTH_SECRET")),
  });
}

export function logServerError(
  scope: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  const errorId = randomUUID().slice(0, 8);

  console.error(`[${scope}] errorId=${errorId}`, {
    ...serializeError(error),
    ...meta,
  });

  return errorId;
}
