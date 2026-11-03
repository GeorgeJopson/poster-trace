import { expect, test } from "./fixtures";

import { createCampaign, expireSession, mainNav, signUp } from "./helpers";

// A session that ends while the app is open (here, by deleting its cookie)
// sends the user to log in on their next request.

test("redirects to log in when navigating after the session expires", async ({
  page,
  context,
}) => {
  await signUp(page);

  await expireSession(context);
  // A client-side navigation, so the (app) layout doesn't re-render.
  await mainNav(page).getByRole("link", { name: "Account" }).click();
  await expect(page).toHaveURL("/log-in");
});

test("redirects to log in when submitting a form after the session expires", async ({
  page,
  context,
}) => {
  await signUp(page);
  await createCampaign(page, {
    name: "Session campaign",
    target: "https://example.com/",
  });

  await page.getByRole("button", { name: "Edit campaign" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit campaign" });
  await dialog.getByLabel("Campaign Name").fill("Never saved");

  await expireSession(context);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL("/log-in");
});
