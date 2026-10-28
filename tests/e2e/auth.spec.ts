import { expect, test } from "@playwright/test";

import { mainNav, newCredentials, signUp, submitLogIn } from "./helpers";

test("signs up, signs out and logs back in", async ({ page }) => {
  const credentials = await signUp(page);

  await mainNav(page).getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL("/");

  await submitLogIn(page, credentials);
  await expect(page).toHaveURL("/dashboard");
});

test("redirects signed-in users away from log in and sign up", async ({
  page,
}) => {
  await signUp(page);

  for (const path of ["/log-in", "/sign-up"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/dashboard");
  }
});

test("redirects signed-out users from app pages to log in", async ({
  page,
}) => {
  const campaignPath = "/dashboard/campaign/1";
  for (const path of [
    "/dashboard",
    "/account",
    "/register",
    campaignPath,
    `${campaignPath}/analytics`,
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL("/log-in");
  }
});

test("shows a confirmation after requesting a password reset", async ({
  page,
}) => {
  // An email with no account, so no email is actually sent.
  const { email } = newCredentials();

  await page.goto("/password-reset");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset email" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "If an account exists for that email, we've sent a reset link.",
  );
});

test("deletes the account", async ({ page }) => {
  const credentials = await signUp(page);

  await page.goto("/account");
  await page.getByRole("button", { name: "Delete Account" }).click();
  const dialog = page.getByRole("dialog", { name: "Are you sure?" });
  await dialog.getByLabel('Type "DELETE" to confirm').fill("DELETE");
  await dialog.getByRole("button", { name: "Delete Account" }).click();
  await expect(page).toHaveURL("/");

  // Signed out: app pages send the user to log in.
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/log-in");

  // And the account is gone, so logging in fails.
  await submitLogIn(page, credentials);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL("/log-in");
});
