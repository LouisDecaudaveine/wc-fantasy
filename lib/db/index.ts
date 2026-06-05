import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

type Database = LibSQLDatabase<typeof schema>;

let dbInstance: Database | undefined;

function resolveDatabaseUrl(): string {
  const url = getEnv("TURSO_DATABASE_URL");

  if (url) {
    return url;
  }

  if (getEnv("VERCEL") || process.env.NODE_ENV === "production") {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add it to your Vercel project environment variables.",
    );
  }

  return "file:local.db";
}

function createDb(): Database {
  const url = resolveDatabaseUrl();
  const authToken = getEnv("TURSO_AUTH_TOKEN");

  if (url.startsWith("libsql://") && !authToken) {
    throw new Error(
      "TURSO_AUTH_TOKEN is required when using a remote Turso database.",
    );
  }

  console.info("[db] creating client", {
    urlScheme: url.split(":")[0],
    urlHost: url.startsWith("libsql://")
      ? new URL(url.replace("libsql://", "https://")).host
      : "local",
    hasAuthToken: Boolean(authToken),
  });

  const client = createClient({
    url,
    authToken,
  });

  return drizzle(client, { schema });
}

function getDb(): Database {
  if (!dbInstance) {
    dbInstance = createDb();
  }

  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDb();
    const value = instance[prop as keyof Database];

    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }

    return value;
  },
});

export type { Database };
