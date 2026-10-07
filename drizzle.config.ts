import { defineConfig } from "drizzle-kit";

// `npx drizzle-kit generate` writes migrations straight into the directory
// Netlify applies on every deploy. Never run `drizzle-kit push` or
// `drizzle-kit migrate` against a Netlify-hosted database: schema changes
// only reach it as committed migration files.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "netlify/database/migrations",
});
