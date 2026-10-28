import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

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
    // End-to-end tests run with Playwright (npm run test:e2e).
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    passWithNoTests: true,
  },
});
