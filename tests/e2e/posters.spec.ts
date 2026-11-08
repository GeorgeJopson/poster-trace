import fs from "node:fs";
import type { Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

import { expect, test } from "./fixtures";
import {
  addPosterDesign,
  createCampaign,
  DESIGN_FILE_LABEL,
  generatePosters,
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

test.describe("the design preview's QR code", () => {
  type DecodedQrCode = {
    data: string;
    /** The QR code's own top-left corner, as a share of the canvas's size. */
    topLeft: { x: number; y: number };
  };

  /**
   * Reads the QR code drawn on the preview canvas, with jsQR loaded into the
   * page, or `null` if there's no readable QR code on it.
   */
  async function readPreviewQrCode(page: Page): Promise<DecodedQrCode | null> {
    if (!(await page.evaluate(() => "jsQR" in window))) {
      await page.addScriptTag({ path: require.resolve("jsqr/dist/jsQR.js") });
    }
    return page
      .getByRole("dialog", { name: "Create new poster design" })
      .locator("canvas")
      .evaluate((canvas: HTMLCanvasElement) => {
        const { width, height } = canvas;
        const pixels = canvas
          .getContext("2d")!
          .getImageData(0, 0, width, height);
        const jsQR = (
          window as unknown as { jsQR: typeof import("jsqr").default }
        ).jsQR;
        const code = jsQR(pixels.data, width, height);
        if (!code) return null;
        const corner = code.location.topLeftCorner;
        return {
          data: code.data,
          topLeft: { x: corner.x / width, y: corner.y / height },
        };
      });
  }

  async function placeQrCode(
    page: Page,
    placement: { x: string; y: string; size: string; rotation: string },
  ) {
    const dialog = page.getByRole("dialog", {
      name: "Create new poster design",
    });
    await dialog.getByLabel("QR X position").fill(placement.x);
    await dialog.getByLabel("QR Y position").fill(placement.y);
    await dialog.getByLabel("QR size").fill(placement.size);
    await dialog.getByLabel("QR rotation").fill(placement.rotation);
  }

  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: "New Poster Design" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Create new poster design",
    });
    await dialog.getByLabel(DESIGN_FILE_LABEL).setInputFiles(await pdfFile());
    // The size slider is enabled once the image has loaded.
    await expect(dialog.getByLabel("QR size")).toBeEnabled();
  });

  test("encodes a sample scan URL, as its posters encode theirs", async ({
    page,
  }) => {
    await placeQrCode(page, { x: "25", y: "20", size: "50", rotation: "0" });

    await expect
      .poll(async () => (await readPreviewQrCode(page))?.data)
      .toMatch(
        /^https?:\/\/[^/]+\/redirect\/00000000-0000-0000-0000-000000000000$/,
      );
  });

  test("is drawn at its placement, from the design's top-left corner", async ({
    page,
  }) => {
    await placeQrCode(page, { x: "25", y: "20", size: "50", rotation: "0" });

    // 25% across and 20% down.
    await expect
      .poll(async () => (await readPreviewQrCode(page))?.topLeft)
      .toEqual({
        x: expect.closeTo(0.25, 2),
        y: expect.closeTo(0.2, 2),
      });
  });

  test("turns clockwise, as on the printed posters", async ({ page }) => {
    await placeQrCode(page, { x: "25", y: "20", size: "50", rotation: "90" });

    // A quarter turn clockwise about its centre takes its top-left corner to
    // the top-right: 25% + 50% across, and still 20% down.
    await expect
      .poll(async () => (await readPreviewQrCode(page))?.topLeft)
      .toEqual({
        x: expect.closeTo(0.75, 2),
        y: expect.closeTo(0.2, 2),
      });
  });
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
  // `request` shares no cookies with `page`, so the scanner isn't signed in.
  test("sends the scanner to the campaign's target, uncached", async ({
    page,
    request,
  }) => {
    await addPosterDesign(page);
    const [path] = await generatePosters(page, 1);

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
