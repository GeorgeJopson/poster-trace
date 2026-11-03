import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "netlify/database/migrations");

/**
 * Recreates the test database's schema by applying every migration in order,
 * from the baseline up, as `npm run db:reset` does.
 */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Set TEST_DATABASE_URL to a disposable local Postgres database (see README.md).",
    );
  }
  // The schema is dropped, so never run against anything but a local database.
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)) {
    throw new Error("TEST_DATABASE_URL must point at localhost.");
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const migrations = fs.readdirSync(MIGRATIONS_DIR).sort();
    for (const migration of migrations) {
      const sql = fs.readFileSync(
        path.join(MIGRATIONS_DIR, migration, "migration.sql"),
        "utf8",
      );
      for (const statement of sql.split("--> statement-breakpoint")) {
        if (statement.trim()) await client.query(statement);
      }
    }
  } finally {
    await client.end();
  }
}
