import path from "node:path";
import { expect, type BrowserContext, type Page } from "@playwright/test";

export const POSTER_IMAGE = path.join(
  process.cwd(),
  "public/poster-images/stock-poster-1.webp",
);

export type Credentials = { name: string; email: string; password: string };

/** A new user's details, unique to this test run. */
export function newCredentials(): Credentials {
  const id = crypto.randomUUID();
  return {
    name: "E2E User",
    email: `e2e-${id}@example.com`,
    password: `password-${id.slice(0, 8)}`,
  };
}

/** Signs up a new user, who ends up signed in on the dashboard. */
export async function signUp(page: Page, credentials = newCredentials()) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(credentials.name);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  return credentials;
}

/** Fills in and submits the log-in form, without waiting for the result. */
export async function submitLogIn(page: Page, credentials: Credentials) {
  await page.goto("/log-in");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Log In", exact: true }).click();
}

export function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main" });
}

/** Creates a campaign from the dashboard and returns its page's URL. */
export async function createCampaign(
  page: Page,
  { name, target }: { name: string; target: string },
) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "New Poster Campaign" }).click();
  const dialog = page.getByRole("dialog", { name: "Create new campaign" });
  await dialog.getByLabel("Campaign Name").fill(name);
  await dialog.getByLabel("Target URL").fill(target);
  await dialog.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL(/\/dashboard\/campaign\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  return page.url();
}

/**
 * Adds a poster design to the campaign whose page is open, and returns the
 * URL its image is served from.
 */
export async function addPosterDesign(page: Page) {
  await page.getByRole("button", { name: "New Poster Design" }).click();
  const dialog = page.getByRole("dialog", { name: "Create new poster design" });
  await dialog.getByLabel("Poster image").setInputFiles(POSTER_IMAGE);
  // The size slider is enabled once the image has loaded.
  const size = dialog.getByLabel("QR size");
  await expect(size).toBeEnabled();
  await dialog.getByLabel("QR X position").fill("40");
  await dialog.getByLabel("QR Y position").fill("60");
  await size.fill("100");
  await dialog.getByLabel("QR rotation").fill("15");

  const imageResponse = page.waitForResponse((response) =>
    /\/api\/poster-designs\/[^/]+\/image$/.test(
      new URL(response.url()).pathname,
    ),
  );
  await dialog.getByRole("button", { name: "Create poster design" }).click();
  await expect(dialog).toBeHidden();
  const response = await imageResponse;
  expect(response.status()).toBe(200);
  return response.url();
}

/** Signs the browser out by deleting Better Auth's session cookie. */
export async function expireSession(context: BrowserContext) {
  await context.clearCookies({ name: /session_token/ });
}
