import fs from "node:fs";
import type { Locator, Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

import { savedQrPlacements } from "./database";
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

type DecodedQrCode = {
  data: string;
  /** The QR code's own top-left corner, as a share of the canvas's size. */
  topLeft: { x: number; y: number };
};

function posterDesignDialog(page: Page) {
  return page.getByRole("dialog", { name: "Create new poster design" });
}

/** The poster design's preview, where the QR code is placed. */
function preview(page: Page) {
  return posterDesignDialog(page).getByRole("application", {
    name: "QR code position",
  });
}

/** Opens the poster design dialog and picks a design, ready to place its QR code. */
async function openWithDesign(page: Page) {
  await page.getByRole("button", { name: "New Poster Design" }).click();
  const dialog = posterDesignDialog(page);
  await dialog.getByLabel(DESIGN_FILE_LABEL).setInputFiles(await pdfFile());
  // The size slider is enabled once the image has loaded.
  await expect(dialog.getByLabel("QR size")).toBeEnabled();
}

/**
 * Reads the QR code drawn on the preview canvas, with jsQR loaded into the
 * page, or `null` if there's no readable QR code on it.
 */
async function readPreviewQrCode(page: Page): Promise<DecodedQrCode | null> {
  if (!(await page.evaluate(() => "jsQR" in window))) {
    await page.addScriptTag({ path: require.resolve("jsqr/dist/jsQR.js") });
  }
  return preview(page).evaluate((canvas: HTMLCanvasElement) => {
    const { width, height } = canvas;
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, width, height);
    const jsQR = (window as unknown as { jsQR: typeof import("jsqr").default })
      .jsQR;
    const code = jsQR(pixels.data, width, height);
    if (!code) return null;
    const corner = code.location.topLeftCorner;
    return {
      data: code.data,
      topLeft: { x: corner.x / width, y: corner.y / height },
    };
  });
}

/** The QR placement the form would submit, as numbers. */
async function submittedPlacement(page: Page) {
  const dialog = posterDesignDialog(page);
  const value = async (field: Locator) => Number(await field.inputValue());
  return {
    // The position is set on the preview, so its inputs are hidden.
    x: await value(dialog.locator('input[name="x"]')),
    y: await value(dialog.locator('input[name="y"]')),
    size: await value(dialog.getByLabel("QR size")),
    rotation: await value(dialog.getByLabel("QR rotation")),
  };
}

/** A point on the preview, as shares of its displayed width and height. */
type PreviewPoint = { x: number; y: number };

/** Drags with the mouse from one point on the preview to another. */
async function dragOnPreview(page: Page, from: PreviewPoint, to: PreviewPoint) {
  const box = (await preview(page).boundingBox())!;
  const at = (point: PreviewPoint) =>
    [box.x + point.x * box.width, box.y + point.y * box.height] as const;
  await page.mouse.move(...at(from));
  await page.mouse.down();
  await page.mouse.move(...at(to), { steps: 5 });
  await page.mouse.up();
}

// The default placement, x 65%, y 75.3%, size 30% of the width, fills x 65% to
// 95% of the preview's width and y 75.3% to 96.5% of its height, centred at
// (80%, 85.9%).
const DEFAULT_PLACEMENT = { x: 65, y: 75.3, size: 30, rotation: 0 };
const DEFAULT_CENTRE = { x: 0.8, y: 0.859 };

test.describe("the design preview's QR code", () => {
  test.beforeEach(async ({ page }) => {
    await openWithDesign(page);
  });

  test("encodes a sample scan URL, as its posters encode theirs", async ({
    page,
  }) => {
    await expect
      .poll(async () => (await readPreviewQrCode(page))?.data)
      .toMatch(
        /^https?:\/\/[^/]+\/redirect\/00000000-0000-0000-0000-000000000000$/,
      );
  });

  test("is drawn at its placement, from the design's top-left corner", async ({
    page,
  }) => {
    await posterDesignDialog(page).getByLabel("QR size").fill("15");

    // 65% across and 75.3% down, the default position.
    await expect
      .poll(async () => (await readPreviewQrCode(page))?.topLeft)
      .toEqual({
        x: expect.closeTo(0.65, 2),
        y: expect.closeTo(0.753, 2),
      });
  });

  test("turns clockwise, as on the printed posters", async ({ page }) => {
    await posterDesignDialog(page).getByLabel("QR rotation").fill("90");

    // A quarter turn clockwise about its centre takes its top-left corner to
    // the top-right: 65% + 30% across, and still 75.3% down.
    await expect
      .poll(async () => (await readPreviewQrCode(page))?.topLeft)
      .toEqual({
        x: expect.closeTo(0.95, 2),
        y: expect.closeTo(0.753, 2),
      });
  });
});

test.describe("placing the QR code", () => {
  const nudgeButton = (page: Page, direction: string) =>
    posterDesignDialog(page).getByRole("button", {
      name: `Move QR code ${direction}`,
    });
  const resetButton = (page: Page) =>
    posterDesignDialog(page).getByRole("button", { name: "Reset" });

  test("waits for the design to load before offering to move or resize the code", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Poster Design" }).click();
    const dialog = posterDesignDialog(page);

    // The editor (the preview and its buttons) only shows once there's a design.
    await expect(preview(page)).toBeHidden();
    for (const direction of ["up", "down", "left", "right"]) {
      await expect(nudgeButton(page, direction)).toBeHidden();
    }
    await expect(resetButton(page)).toBeHidden();
    await expect(dialog.getByLabel("QR size")).toBeDisabled();
    await expect(dialog.getByLabel("QR rotation")).toBeEnabled();
  });

  test("grows the dialog to show the design as big as the screen allows", async ({
    page,
  }) => {
    await openWithDesign(page);
    const viewport = page.viewportSize()!;

    await expect(preview(page)).toBeVisible();
    const dialogBox = (await posterDesignDialog(page).boundingBox())!;
    expect(dialogBox.height).toBeCloseTo(viewport.height * 0.95, 0);

    // The design is A4, so the preview keeps its proportions.
    const previewBox = (await preview(page).boundingBox())!;
    expect(previewBox.height / previewBox.width).toBeCloseTo(Math.SQRT2, 1);
  });

  test.describe("with a design picked", () => {
    test.beforeEach(async ({ page }) => {
      await openWithDesign(page);
    });

    test("starts in the bottom-right corner, where it can be seen", async ({
      page,
    }) => {
      expect(await submittedPlacement(page)).toEqual(DEFAULT_PLACEMENT);
      await expect
        .poll(async () => (await readPreviewQrCode(page))?.topLeft)
        .toEqual({
          x: expect.closeTo(0.65, 2),
          y: expect.closeTo(0.753, 2),
        });
    });

    test("moves 1% at a time with the nudge buttons", async ({ page }) => {
      await nudgeButton(page, "right").click();
      await nudgeButton(page, "right").click();
      await nudgeButton(page, "up").click();
      expect(await submittedPlacement(page)).toMatchObject({
        x: 67,
        y: 74.3,
      });

      await nudgeButton(page, "left").click();
      await nudgeButton(page, "down").click();
      await nudgeButton(page, "down").click();
      expect(await submittedPlacement(page)).toMatchObject({
        x: 66,
        y: 76.3,
      });
    });

    test("moves 1% at a time with the arrow keys, without scrolling", async ({
      page,
    }) => {
      // Whether the page's own handling of each arrow key was prevented, as
      // seen once the event has finished bubbling.
      await page.evaluate(() => {
        const prevented: boolean[] = [];
        (window as unknown as { prevented: boolean[] }).prevented = prevented;
        window.addEventListener("keydown", (event) =>
          prevented.push(event.defaultPrevented),
        );
      });

      await preview(page).focus();
      for (const key of ["ArrowLeft", "ArrowLeft", "ArrowDown", "ArrowUp"]) {
        await page.keyboard.press(key);
      }
      await page.keyboard.press("ArrowUp");

      expect(await submittedPlacement(page)).toMatchObject({
        x: 63,
        y: 74.3,
      });
      expect(
        await page.evaluate(
          () => (window as unknown as { prevented: boolean[] }).prevented,
        ),
      ).toEqual([true, true, true, true, true]);
    });

    test("drags the code by where it was grabbed, without it jumping", async ({
      page,
    }) => {
      // Grabbed at its centre and moved 50% left and 40% up.
      await dragOnPreview(page, DEFAULT_CENTRE, {
        x: DEFAULT_CENTRE.x - 0.5,
        y: DEFAULT_CENTRE.y - 0.4,
      });

      const placement = await submittedPlacement(page);
      expect(placement.x).toBeCloseTo(15, 0);
      expect(placement.y).toBeCloseTo(35.3, 0);
      await expect
        .poll(async () => (await readPreviewQrCode(page))?.topLeft)
        .toEqual({
          x: expect.closeTo(placement.x / 100, 2),
          y: expect.closeTo(placement.y / 100, 2),
        });
    });

    test("only drags when the press is on the code", async ({ page }) => {
      // Just above the code's top-left corner, then to the middle.
      await dragOnPreview(page, { x: 0.66, y: 0.745 }, { x: 0.5, y: 0.5 });

      expect(await submittedPlacement(page)).toEqual(DEFAULT_PLACEMENT);
    });

    test("drags a rotated code where it's drawn", async ({ page }) => {
      await posterDesignDialog(page).getByLabel("QR rotation").fill("45");
      // Turned 45°, the code's corners point up, down, left and right, 21.2%
      // of the width from its centre, so it no longer covers its unrotated
      // top-left corner (15% left and up), but does reach 18% above its
      // centre, outside the unrotated square.
      const box = (await preview(page).boundingBox())!;
      const up = (0.18 * box.width) / box.height;

      await dragOnPreview(
        page,
        { x: 0.665, y: DEFAULT_CENTRE.y - (0.135 * box.width) / box.height },
        { x: 0.5, y: 0.5 },
      );
      expect(await submittedPlacement(page)).toMatchObject({ x: 65, y: 75.3 });

      await dragOnPreview(
        page,
        { x: DEFAULT_CENTRE.x, y: DEFAULT_CENTRE.y - up },
        { x: DEFAULT_CENTRE.x - 0.5, y: DEFAULT_CENTRE.y - up },
      );
      const placement = await submittedPlacement(page);
      expect(placement.x).toBeCloseTo(15, 0);
      expect(placement.y).toBeCloseTo(75.3, 0);
    });

    test("keeps dragging outside the preview, stopping at the limits", async ({
      page,
    }) => {
      await dragOnPreview(page, DEFAULT_CENTRE, { x: 1.4, y: 1.4 });
      expect(await submittedPlacement(page)).toMatchObject({ x: 100, y: 100 });
      await expect(nudgeButton(page, "right")).toBeDisabled();
      await expect(nudgeButton(page, "down")).toBeDisabled();
      await expect(nudgeButton(page, "left")).toBeEnabled();
      await expect(nudgeButton(page, "up")).toBeEnabled();

      await resetButton(page).click();
      await dragOnPreview(page, DEFAULT_CENTRE, { x: -0.4, y: -0.4 });
      expect(await submittedPlacement(page)).toMatchObject({ x: 0, y: 0 });
      await expect(nudgeButton(page, "left")).toBeDisabled();
      await expect(nudgeButton(page, "up")).toBeDisabled();
      await expect(nudgeButton(page, "right")).toBeEnabled();
      await expect(nudgeButton(page, "down")).toBeEnabled();
    });

    test("resets the position, size and rotation to where it started", async ({
      page,
    }) => {
      const dialog = posterDesignDialog(page);
      await expect(resetButton(page)).toBeDisabled();

      await nudgeButton(page, "left").click();
      await dialog.getByLabel("QR size").fill("40");
      await dialog.getByLabel("QR rotation").fill("90");
      await expect(resetButton(page)).toBeEnabled();

      await resetButton(page).click();
      expect(await submittedPlacement(page)).toEqual(DEFAULT_PLACEMENT);
      await expect(resetButton(page)).toBeDisabled();
    });

    test("starts again from the bottom-right corner when another design is picked", async ({
      page,
    }) => {
      const dialog = posterDesignDialog(page);
      await nudgeButton(page, "up").click();
      await dialog.getByLabel("QR size").fill("40");

      await dialog.getByLabel(DESIGN_FILE_LABEL).setInputFiles(await pdfFile());

      await expect
        .poll(() => submittedPlacement(page))
        .toEqual(DEFAULT_PLACEMENT);
    });

    test("creates the poster design with the placement shown", async ({
      page,
    }) => {
      const dialog = posterDesignDialog(page);
      await dragOnPreview(page, DEFAULT_CENTRE, { x: 0.5, y: 0.5 });
      await resetButton(page).click();
      await nudgeButton(page, "right").click();
      await dialog.getByLabel("QR size").fill("15");
      await dialog.getByLabel("QR rotation").fill("30");

      await dialog
        .getByRole("button", { name: "Create poster design" })
        .click();
      await expect(dialog).toBeHidden();

      const campaignId = new URL(page.url()).pathname.split("/").at(-1)!;
      expect(await savedQrPlacements(campaignId)).toEqual([
        { x: 66, y: 75.3, size: 15, rotation: 30 },
      ]);
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
    test(`shows a "poster not found" page with a 404 for ${name}`, async ({
      page,
    }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      expect(response?.headers()["cache-control"]).toBe("no-store");
      // The page is rendered for another path, so check it survives hydration.
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(path);
      await expect(
        page.getByRole("heading", { name: "Poster not found" }),
      ).toBeVisible();
    });
  }
});
