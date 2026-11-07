import {
  degrees,
  PDFDocument,
  rgb,
  type PDFEmbeddedPage,
  type PDFPage,
} from "pdf-lib";

import type { PosterDto } from "@application/dto/PosterDto";
import type { QrPlacementDto } from "@application/dto/PosterDesignDto";
import {
  PosterDesignImageRules,
  type PosterDesignImageType,
} from "@domain/campaign/design/PosterDesignImageRules";

import { createQrModules, type QrModules } from "./drawPoster";

/** An A4 page in PDF points (1/72 inch), portrait. */
export const A4 = PosterDesignImageRules.A4;

export type PosterPdfDesign = {
  /** The design: a one-page, unrotated portrait A4 PDF. */
  data: Uint8Array | ArrayBuffer;
  contentType: PosterDesignImageType;
  qrPlacement: QrPlacementDto;
};

/** Where the QR code goes on the page, in PDF points from its bottom-left. */
export type QrLayout = {
  centreX: number;
  centreY: number;
  /** The QR code's width on the page. */
  size: number;
  /** Degrees anticlockwise, as PDFs measure them. */
  rotation: number;
};

/**
 * Places the QR code on the page. The design fills the A4 page, and the QR
 * placement is relative to the design (see QrPlacement), so it's relative to
 * the page too.
 */
export function layoutQrCode(qrPlacement: QrPlacementDto): QrLayout {
  // QR placement is measured from the design's top-left corner, downwards,
  // but PDF y coordinates go up from the bottom.
  const size = (qrPlacement.size / 100) * A4.width;
  const left = (qrPlacement.x / 100) * A4.width;
  const top = (qrPlacement.y / 100) * A4.height;
  return {
    centreX: left + size / 2,
    centreY: A4.height - top - size / 2,
    size,
    // The preview turns it clockwise. `|| 0` avoids -0.
    rotation: -qrPlacement.rotation || 0,
  };
}

/**
 * The QR code's dark modules as one SVG path, centred on (0, 0) and
 * `size` across. Runs of dark modules in a row are joined into one rectangle,
 * so there are fewer seams for a viewer to show between them.
 */
function qrPath(modules: QrModules, size: number): string {
  const moduleSize = size / modules.size;
  const start = -size / 2;
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
      const left = start + runStart * moduleSize;
      const top = start + row * moduleSize;
      const runWidth = (col - runStart) * moduleSize;
      commands.push(`M${left} ${top}h${runWidth}v${moduleSize}h${-runWidth}Z`);
    }
  }
  return commands.join("");
}

/**
 * Embeds the design's page, cut to its CropBox as pdf.js shows it. The page
 * is validated as unrotated portrait A4 on upload, so it's drawn as stored.
 */
async function embedDesign(
  pdf: PDFDocument,
  design: PosterPdfDesign,
): Promise<PDFEmbeddedPage> {
  if (design.contentType !== PosterDesignImageRules.PDF_TYPE) {
    throw new Error(`Can't make posters from a ${design.contentType} design`);
  }
  const source = await PDFDocument.load(design.data, {
    updateMetadata: false,
  });
  const page = source.getPage(0);
  const crop = page.getCropBox();
  // Embedded as a vector page, so it prints at full quality.
  return pdf.embedPage(page, {
    left: crop.x,
    bottom: crop.y,
    right: crop.x + crop.width,
    top: crop.y + crop.height,
  });
}

function drawQrCode(page: PDFPage, qr: QrLayout, url: string) {
  page.drawSvgPath(qrPath(createQrModules(url), qr.size), {
    x: qr.centreX,
    y: qr.centreY,
    rotate: degrees(qr.rotation),
    color: rgb(0, 0, 0),
    borderWidth: 0,
  });
}

/**
 * A PDF with one A4 page per poster: the design with that poster's QR code
 * drawn on top as vector shapes. The design is embedded once and shared by
 * every page, so the file stays small however many posters there are.
 */
export default async function drawPosterPdf(
  design: PosterPdfDesign,
  posters: readonly Pick<PosterDto, "scanUrl">[],
): Promise<Uint8Array<ArrayBuffer>> {
  const pdf = await PDFDocument.create();
  const embedded = await embedDesign(pdf, design);
  const qr = layoutQrCode(design.qrPlacement);

  for (const poster of posters) {
    const page = pdf.addPage([A4.width, A4.height]);
    // Stretched to fill the page, which it's within a millimetre of.
    page.drawPage(embedded, { x: 0, y: 0, width: A4.width, height: A4.height });
    drawQrCode(page, qr, poster.scanUrl);
  }
  return (await pdf.save()) as Uint8Array<ArrayBuffer>;
}
