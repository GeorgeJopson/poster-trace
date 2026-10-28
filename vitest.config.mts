import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

const DB_TESTS = "tests/**/*.db.test.ts";

export default defineConfig({
  // Resolves @domain/*, @application/* etc. as in the app.
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Every application service imports "server-only", which throws when
      // imported outside Next.
      "server-only": fileURLToPath(
        new URL("./tests/emptyModule.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          // npm test: everything that runs without a database. End-to-end
          // tests run with Playwright (npm run test:e2e).
          name: "unit",
          exclude: [...configDefaults.exclude, "tests/e2e/**", DB_TESTS],
        },
      },
      {
        extends: true,
        test: {
          // npm run test:db: against the Postgres in TEST_DATABASE_URL.
          name: "db",
          include: [DB_TESTS],
          globalSetup: ["tests/infrastructure/db/globalSetup.ts"],
          setupFiles: ["tests/infrastructure/db/setup.ts"],
          // The tests share one database.
          fileParallelism: false,
        },
      },
    ],
  },
});
