import { drizzle } from "drizzle-orm/netlify-db";

import { relations } from "@/db/relations";

// Connects to Netlify Database using NETLIFY_DB_URL, which Netlify sets in
// builds and functions, and `netlify dev` sets locally. Each deploy preview
// gets its own database branch automatically.
function createDb() {
  return drizzle({ relations });
}

const globalForDb = global as unknown as {
  db: ReturnType<typeof createDb>;
};

// Reuse one client across hot reloads in development.
const db = globalForDb.db || createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export default db;
