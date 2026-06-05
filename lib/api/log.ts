import { randomUUID } from "crypto";

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
    vercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV,
    hasTursoDatabaseUrl: Boolean(process.env.TURSO_DATABASE_URL?.trim()),
    hasTursoAuthToken: Boolean(process.env.TURSO_AUTH_TOKEN?.trim()),
    hasInviteCode: Boolean(process.env.INVITE_CODE),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
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
