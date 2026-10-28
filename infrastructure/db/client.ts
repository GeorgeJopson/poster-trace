import { getDatabase } from "@netlify/database";
import { drizzle } from "drizzle-orm/netlify-db";

import { relations } from "./relations";

// Connects to Netlify Database using NETLIFY_DB_URL, which Netlify sets in
// builds and functions, and `netlify dev` sets locally. Each deploy preview
// gets its own database branch automatically.
function createDb() {
  const client = getDatabase();
  if (client.driver === "server") return drizzle({ client, relations });

  // drizzle-orm 1.0.0-rc.4 calls the Neon HTTP client as sql(text, params),
  // which @neondatabase/serverless 1.x rejects. Send those calls to
  // sql.query(text, params) instead.
  const { httpClient } = client;
  const compatHttpClient = new Proxy(httpClient, {
    apply: (_target, _thisArg, args: Parameters<typeof httpClient.query>) =>
      httpClient.query(...args),
  });
  return drizzle({
    client: { ...client, httpClient: compatHttpClient },
    relations,
  });
}

export type Db = ReturnType<typeof createDb>;

const globalForDb = global as unknown as { db?: Db };

function connectDb() {
  // Reuse one client across hot reloads in development.
  globalForDb.db ??= createDb();
  return globalForDb.db;
}

// Schema metadata (`db._`) that needs no connection. Better Auth's adapter
// reads it as soon as infrastructure/auth/betterAuth.ts is imported.
const metadata = drizzle.mock({ relations })._;

// getDatabase() throws if NETLIFY_DB_URL is missing, and `next build` imports
// this module, so wait until the database is first used to connect.
const db = new Proxy({} as Db, {
  get(_target, property) {
    if (property === "_" && !globalForDb.db) return metadata;
    const value = Reflect.get(connectDb(), property);
    return typeof value === "function" ? value.bind(connectDb()) : value;
  },
});

/**
 * The database. Calling this never connects: it returns a client that
 * connects on first use, so it's safe at import time and during `next build`.
 */
export function getDb(): Db {
  return db;
}
