import { registerPoster } from "./database";
import { expect, test } from "./fixtures";
import {
  addPosterDesign,
  createCampaign,
  generatePosters,
  signUp,
} from "./helpers";

test("shows the campaign's scans once its posters are scanned", async ({
  page,
  request,
}) => {
  await signUp(page);
  const campaignUrl = await createCampaign(page, {
    name: "Analytics campaign",
    target: "https://example.com/",
  });
  await addPosterDesign(page);
  const [scanned] = await generatePosters(page, 3);

  await page.goto(`${campaignUrl}/analytics`);
  const topPosters = page.getByRole("region", { name: "Top posters" });
  await expect(topPosters.getByText("No scans yet.")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Scan distribution" }),
  ).toBeVisible();

  // `request` shares no cookies with `page`, so the scanner isn't signed in.
  for (let i = 0; i < 2; i++) {
    await request.get(scanned, { maxRedirects: 0 });
  }

  // Scans are recorded after the redirect, so they may take a moment.
  const posterId = scanned.split("/").at(-1)!;
  await expect(async () => {
    await page.reload();
    const poster = topPosters.getByRole("listitem");
    await expect(poster).toHaveCount(1);
    await expect(poster).toContainText(`Unregistered #${posterId.slice(0, 8)}`);
    await expect(poster).toContainText("2 scans");
  }).toPass();
});

test.describe("scan map", () => {
  // Keep CARTO out of tests: no key or tile quota used, and no dependence on
  // CARTO being up.
  test.beforeEach(async ({ page }) => {
    // The style is on basemaps.cartocdn.com; tiles, glyphs and sprites are
    // on its subdomains.
    await page.route(
      /^https:\/\/([\w-]+\.)*basemaps\.cartocdn\.com\//,
      (route) => route.abort(),
    );
  });

  test("maps the located posters and says how many aren't on the map", async ({
    page,
  }) => {
    await signUp(page);
    const campaignUrl = await createCampaign(page, {
      name: "Located campaign",
      target: "https://example.com/",
    });
    await addPosterDesign(page);
    const [located, unlocated] = await generatePosters(page, 3);
    await registerPoster(located, "Corner café", {
      latitude: 51.5072,
      longitude: -0.1276,
    });
    await registerPoster(unlocated, "Station");

    await page.goto(`${campaignUrl}/analytics`);
    const scanMap = page.getByRole("region", { name: "Scan map" });
    await expect(scanMap).toBeVisible();
    await expect(scanMap).toContainText(
      "2 of 3 posters aren't on the map because they haven't been registered with a location.",
    );
  });

  test("shows a message instead of the map when no poster is located", async ({
    page,
  }) => {
    await signUp(page);
    const campaignUrl = await createCampaign(page, {
      name: "Unmapped campaign",
      target: "https://example.com/",
    });
    await addPosterDesign(page);
    const [poster] = await generatePosters(page, 2);
    await registerPoster(poster, "Station");

    const tileRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).hostname.endsWith("basemaps.cartocdn.com")) {
        tileRequests.push(request.url());
      }
    });
    await page.goto(`${campaignUrl}/analytics`);
    const scanMap = page.getByRole("region", { name: "Scan map" });
    await expect(scanMap).toContainText(
      "None of this campaign's posters are on the map yet.",
    );
    await expect(scanMap).not.toContainText("aren't on the map");
    // The map would only start once the page is hydrated, so wait for that.
    await page.waitForLoadState("networkidle");
    await expect(scanMap.locator(".maplibregl-map")).toHaveCount(0);
    expect(tileRequests).toEqual([]);
  });
});
