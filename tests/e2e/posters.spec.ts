import fs from "node:fs";
import { PDFDocument } from "pdf-lib";

import { makePdf } from "../support/pdfs";
import { expect, test } from "./fixtures";
import { addPosterDesign, createCampaign, signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
  await createCampaign(page, {
    name: "Poster campaign",
    target: "https://example.com/",
  });
});

async function pdfFile(pageCount: number) {
  return {
    name: "design.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await makePdf(pageCount)),
  };
}

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

test("adds a one-page PDF design, previews it and generates posters", async ({
  page,
}) => {
  const imageUrl = await addPosterDesign(page, await pdfFile(1));

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

test("rejects a PDF design with more than one page", async ({ page }) => {
  await page.getByRole("button", { name: "New Poster Design" }).click();
  const dialog = page.getByRole("dialog", { name: "Create new poster design" });
  const input = dialog.getByLabel("Poster image");
  await input.setInputFiles(await pdfFile(2));

  await expect
    .poll(() =>
      input.evaluate((element: HTMLInputElement) => element.validationMessage),
    )
    .toBe("The PDF must have exactly one page.");
});
