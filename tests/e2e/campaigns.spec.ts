import { expect, test } from "@playwright/test";

import { addPosterDesign, createCampaign, mainNav, signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

test("creates campaigns, listed on the dashboard in creation order", async ({
  page,
}) => {
  const names = ["First campaign", "Second campaign", "Third campaign"];
  for (const name of names) {
    await createCampaign(page, { name, target: "https://example.com/" });
  }

  await page.goto("/dashboard");
  await expect(
    page.getByRole("main").getByRole("heading", { level: 2 }),
  ).toHaveText(names);

  await page.getByRole("link", { name: "Second campaign" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Second campaign" }),
  ).toBeVisible();
});

test("edits a campaign's name and target", async ({ page }) => {
  await createCampaign(page, {
    name: "Original name",
    target: "https://example.com/original",
  });

  await page.getByRole("button", { name: "Edit campaign" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit campaign" });
  await dialog.getByLabel("Campaign Name").fill("Renamed campaign");
  await dialog.getByLabel("Target URL").fill("https://example.com/renamed");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();

  await expect(
    page.getByRole("heading", { level: 1, name: "Renamed campaign" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: "https://example.com/renamed" }),
  ).toBeVisible();

  // Still saved after a reload.
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Renamed campaign" }),
  ).toBeVisible();
});

test("shows the validation message for an invalid target", async ({ page }) => {
  await createCampaign(page, {
    name: "Validated campaign",
    target: "https://example.com/",
  });

  await page.getByRole("button", { name: "Edit campaign" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit campaign" });
  const target = dialog.getByLabel("Target URL");
  await target.fill("not a url");
  await dialog.getByRole("button", { name: "Save changes" }).click();

  await expect(dialog).toBeVisible();
  expect(
    await target.evaluate((input: HTMLInputElement) => input.validationMessage),
  ).toBe("Please enter a full URL, starting with https://.");

  await target.fill("ftp://example.com/");
  expect(
    await target.evaluate((input: HTMLInputElement) => input.validationMessage),
  ).toBe("The target URL must start with http:// or https://.");
});

test("adds a poster design, whose image loads from the image route", async ({
  page,
}) => {
  await createCampaign(page, {
    name: "Design campaign",
    target: "https://example.com/",
  });

  const imageUrl = await addPosterDesign(page);

  await expect(
    page.getByRole("img", { name: "Poster design 1" }),
  ).toBeVisible();
  await expect(page.getByText("Preview unavailable")).toHaveCount(0);

  const image = await page.request.get(imageUrl);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/webp");

  // Still listed after a reload, and on the dashboard's card.
  await page.reload();
  await expect(
    page.getByRole("img", { name: "Poster design 1" }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("img", { name: "Design campaign" }),
  ).toBeVisible();
});

test("renders the analytics page and the campaign's navigation", async ({
  page,
}) => {
  const campaignUrl = await createCampaign(page, {
    name: "Analytics campaign",
    target: "https://example.com/",
  });

  await page.goto(`${campaignUrl}/analytics`);
  await expect(
    page.getByRole("heading", { name: "Under Construction" }),
  ).toBeVisible();

  const campaignNav = mainNav(page).getByRole("region", {
    name: "Analytics campaign",
  });
  await expect(campaignNav.getByRole("link", { name: "Create" })).toBeVisible();
  await campaignNav.getByRole("link", { name: "Create" }).click();
  await expect(page).toHaveURL(campaignUrl);
  await campaignNav.getByRole("link", { name: "Analytics" }).click();
  await expect(page).toHaveURL(`${campaignUrl}/analytics`);
});

test("returns 404 for another user's campaign and design image", async ({
  page,
  browser,
}) => {
  const campaignUrl = await createCampaign(page, {
    name: "Private campaign",
    target: "https://example.com/",
  });
  const imageUrl = await addPosterDesign(page);

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await signUp(otherPage);

  const campaignResponse = await otherPage.goto(campaignUrl);
  expect(campaignResponse?.status()).toBe(404);
  const analyticsResponse = await otherPage.goto(`${campaignUrl}/analytics`);
  expect(analyticsResponse?.status()).toBe(404);

  const imageResponse = await otherPage.request.get(imageUrl);
  expect(imageResponse.status()).toBe(404);

  await otherContext.close();
});
