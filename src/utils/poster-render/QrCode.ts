import QRCode from "qrcode";

import type { QrPlacementDto } from "@application/dto/PosterDesignDto";

/** How much of a QR code can be damaged and still scan: 7%, 15%, 25%, 30%. */
export type QrErrorCorrection = "L" | "M" | "Q" | "H";

/**
 * The level every poster's QR code uses, in the preview and in print, so the
 * preview shows the same code that's printed.
 */
export const POSTER_QR_ERROR_CORRECTION: QrErrorCorrection = "Q";

/** A page's size, in whatever units its renderer draws in. */
export type PageSize = { width: number; height: number };

/**
 * Where to draw `svgPath` on a page, in the page's units from its top-left
 * corner: translate to the centre, rotate, then scale.
 */
export type PlacedQrCode = {
  centreX: number;
  centreY: number;
  /** Degrees clockwise. */
  rotation: number;
  /** Page units per module. */
  scale: number;
};

/**
 * A URL encoded as a QR code, drawn by both the preview and the printed
 * posters. Encoding is relatively slow, so keep an instance for as long as its
 * URL is the same.
 */
export class QrCode {
  /**
   * The dark modules as one SVG path, in module units (one module is 1 x 1)
   * and centred on (0, 0). Runs of dark modules in a row are joined into one
   * rectangle, so there are fewer seams for a renderer to show between them.
   */
  readonly svgPath: string;

  private readonly moduleCount: number;

  constructor(url: string, errorCorrection: QrErrorCorrection) {
    // All in byte mode, so the size depends only on the URL's length. Left to
    // choose, qrcode packs runs of digits more tightly, so posters' scan URLs
    // (which differ only in their UUIDs) could come out at different sizes,
    // and the preview's sample wouldn't match the printed posters.
    const modules = QRCode.create(
      [{ data: new TextEncoder().encode(url), mode: "byte" }],
      {
        errorCorrectionLevel: errorCorrection,
      },
    ).modules;
    this.svgPath = toSvgPath(modules);
    this.moduleCount = modules.size;
  }

  /**
   * Where the QR code goes on `page`. The placement's `x` and `y` are its
   * top-left corner as a percentage of the page's width and height, and
   * `size` is its width as a percentage of the page's width, without a quiet
   * zone. It's rotated about its centre.
   */
  place(placement: QrPlacementDto, page: PageSize): PlacedQrCode {
    const size = (placement.size / 100) * page.width;
    return {
      centreX: (placement.x / 100) * page.width + size / 2,
      centreY: (placement.y / 100) * page.height + size / 2,
      rotation: placement.rotation,
      scale: size / this.moduleCount,
    };
  }
}

type QrModules = ReturnType<typeof QRCode.create>["modules"];

function toSvgPath(modules: QrModules): string {
  const start = -modules.size / 2;
  const commands: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    let col = 0;
    while (col < modules.size) {
      if (!modules.get(row, col)) {
        col++;
        continue;
      }
      const runStart = col;
      while (col < modules.size && modules.get(row, col)) col++;
      const runWidth = col - runStart;
      commands.push(
        `M${start + runStart} ${start + row}h${runWidth}v1h${-runWidth}Z`,
      );
    }
  }
  return commands.join("");
}
