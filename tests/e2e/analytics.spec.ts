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
    await expect(poster).toContainText(
      `Poster design 1 #${posterId.slice(0, 8)}`,
    );
    await expect(poster).toContainText("2 scans");
  }).toPass();
});
