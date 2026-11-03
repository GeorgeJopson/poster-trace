import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against `netlify dev`, which provides the local
// database and Blobs store. Reset and seed the local database first:
//
//   npm run db:reset && npm run seed && npm run test:e2e
//
// Each test signs up its own user, so tests don't depend on the seed data or
// on each other.
const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // `next dev` compiles each route on its first request, which can be slow.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "netlify dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
