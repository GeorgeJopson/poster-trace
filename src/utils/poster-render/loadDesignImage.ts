/** A design's image, ready to draw onto a canvas. */
export type DesignImage = {
  source: CanvasImageSource;
  /** The image's size in its own pixels, which QR placements are relative to. */
  width: number;
  height: number;
};

/**
 * Loads a design (a one-page PDF) so it can be drawn onto a canvas. Canvases
 * can't draw PDFs, so its page is rendered with pdf.js, which is only
 * downloaded when a design is loaded. `maxWidth` is the widest it's rendered,
 * in pixels.
 */
export default async function loadDesignImage(
  data: Blob,
  { maxWidth = 1600 }: { maxWidth?: number } = {},
): Promise<DesignImage> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc ||= new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  // pdf.js on its own never runs a PDF's scripts; only its viewer can.
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await data.arrayBuffer()),
  });
  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const pageWidth = page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale: maxWidth / pageWidth });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    await page.render({ canvas, viewport }).promise;
    return { source: canvas, width: canvas.width, height: canvas.height };
  } finally {
    await loadingTask.destroy();
  }
}
