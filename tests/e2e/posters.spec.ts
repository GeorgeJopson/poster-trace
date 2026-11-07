import fs from "node:fs";
import type { Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

import { expect, test } from "./fixtures";
import {
  addPosterDesign,
  createCampaign,
  DESIGN_FILE_LABEL,
  pdfFile,
  signUp,
  type PickedFile,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
  await createCampaign(page, {
    name: "Poster campaign",
    target: "https://example.com/",
  });
});

test("generates posters from a design as a PDF, one page each", async ({
  page,
}) => {
  await addPosterDesign(page);

  await page
    .getByRole("button", { name: /Poster design 1.*Generate Posters/ })
    .click();
  const dialog = page.getByRole("dialog", { name: "Generate posters" });
  await dialog.getByLabel("Number of posters").fill("3");

  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Generate" }).click();
  const file = await download;
  await expect(dialog).toBeHidden();

  expect(file.suggestedFilename()).toBe("Poster campaign - 3 posters.pdf");
  const pdf = await PDFDocument.load(fs.readFileSync(await file.path()));
  expect(pdf.getPageCount()).toBe(3);
});

test("won't generate more than 100 posters at once", async ({ page }) => {
  await addPosterDesign(page);

  await page
    .getByRole("button", { name: /Poster design 1.*Generate Posters/ })
    .click();
  const dialog = page.getByRole("dialog", { name: "Generate posters" });
  const count = dialog.getByLabel("Number of posters");
  await count.fill("101");
  await dialog.getByRole("button", { name: "Generate" }).click();

  // The browser blocks the form, so the dialog stays open.
  expect(
    await count.evaluate((input: HTMLInputElement) => input.validity.valid),
  ).toBe(false);
  await expect(dialog).toBeVisible();
});

test.describe("shows why the server won't generate posters", () => {
  // The browser blocks these values, so its checks are removed to see the
  // server's.
  for (const [count, message] of [
    ["101", "You can generate at most 100 posters at a time."],
    ["2.5", "The number of posters must be a whole number of at least 1."],
  ]) {
    test(`for ${count}`, async ({ page }) => {
      await addPosterDesign(page);

      await page
        .getByRole("button", { name: /Poster design 1.*Generate Posters/ })
        .click();
      const dialog = page.getByRole("dialog", { name: "Generate posters" });
      const input = dialog.getByLabel("Number of posters");
      await input.evaluate((element: HTMLInputElement) => {
        element.removeAttribute("max");
        element.step = "any";
      });
      await input.fill(count);
      await dialog.getByRole("button", { name: "Generate" }).click();

      await expect(dialog.getByRole("alert")).toHaveText(message);
      await expect(dialog).toBeVisible();
    });
  }
});

test("adds an A4 PDF design, previews it and generates posters", async ({
  page,
}) => {
  const imageUrl = await addPosterDesign(page);

  await expect(page.getByText("Preview unavailable")).toHaveCount(0);
  const image = await page.request.get(imageUrl);
  expect(image.headers()["content-type"]).toBe("application/pdf");
  expect(image.headers()["content-disposition"]).toBe("attachment");

  await page
    .getByRole("button", { name: /Poster design 1.*Generate Posters/ })
    .click();
  const dialog = page.getByRole("dialog", { name: "Generate posters" });
  await dialog.getByLabel("Number of posters").fill("2");
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Generate" }).click();
  const pdf = await PDFDocument.load(
    fs.readFileSync(await (await download).path()),
  );
  expect(pdf.getPageCount()).toBe(2);
});

test.describe("rejects a design that isn't a one-page A4 PDF", () => {
  const cases: [string, () => Promise<PickedFile>, string][] = [
    [
      "a PDF with two pages",
      () => pdfFile(2),
      "The PDF must have exactly one page.",
    ],
    [
      "a US Letter PDF",
      () => pdfFile(1, [612, 792]),
      "The PDF's page must be portrait A4 (210 x 297 mm).",
    ],
    [
      "a JPEG",
      async () => ({
        name: "design.jpg",
        mimeType: "image/jpeg",
        // A JPEG's first bytes, which is all the form's format check reads.
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
      }),
      "Please choose a PDF.",
    ],
  ];
  for (const [name, makeFile, message] of cases) {
    test(name, async ({ page }) => {
      await page.getByRole("button", { name: "New Poster Design" }).click();
      const dialog = page.getByRole("dialog", {
        name: "Create new poster design",
      });
      const input = dialog.getByLabel(DESIGN_FILE_LABEL);
      await input.setInputFiles(await makeFile());

      await expect
        .poll(() =>
          input.evaluate(
            (element: HTMLInputElement) => element.validationMessage,
          ),
        )
        .toBe(message);
    });
  }
});

test.describe("scanning a poster's QR code", () => {
  /**
   * Generates one poster and returns the path of its scan URL. The URL
   * itself points at production (POSTER_TRACE_URL), so it's read from the
   * server action's response and requested on this server instead.
   */
  async function generatePoster(page: Page) {
    await addPosterDesign(page);
    await page
      .getByRole("button", { name: /Poster design 1.*Generate Posters/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Generate posters" });
    await dialog.getByLabel("Number of posters").fill("1");

    // The download discards the action's response body, so it's read while
    // passing the response through.
    let body = "";
    await page.route("**/*", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const response = await route.fetch();
      body += await response.text();
      await route.fulfill({ response });
    });
    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Generate" }).click();
    await download;

    const [path] = body.match(/\/redirect\/[0-9a-f-]{36}/) ?? [];
    expect(path).toBeDefined();
    return path!;
  }

  // `request` shares no cookies with `page`, so the scanner isn't signed in.
  test("sends the scanner to the campaign's target, uncached", async ({
    page,
    request,
  }) => {
    const path = await generatePoster(page);

    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe("https://example.com/");
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  for (const [name, path] of [
    ["an unknown poster", `/redirect/${crypto.randomUUID()}`],
    ["a malformed poster id", "/redirect/not-a-poster"],
  ]) {
    test(`returns 404 for ${name}`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(404);
    });
  }
});
