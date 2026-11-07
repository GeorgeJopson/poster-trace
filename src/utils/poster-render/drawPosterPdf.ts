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

import { POSTER_QR_ERROR_CORRECTION, QrCode } from "./QrCode";

/** An A4 page in PDF points (1/72 inch), portrait. */
export const A4 = PosterDesignImageRules.A4;

export type PosterPdfDesign = {
  /** The design: a one-page, unrotated portrait A4 PDF. */
  data: Uint8Array | ArrayBuffer;
  contentType: PosterDesignImageType;
  qrPlacement: QrPlacementDto;
};

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

/**
 * Draws the poster's QR code on `page`. The design fills the A4 page, so the
 * QR placement is relative to the page too.
 */
function drawQrCode(page: PDFPage, qrPlacement: QrPlacementDto, url: string) {
  const qr = new QrCode(url, POSTER_QR_ERROR_CORRECTION);
  const placed = qr.place(qrPlacement, A4);
  // PDF y coordinates go up from the bottom, and PDF angles go anticlockwise.
  // drawSvgPath flips the path's own y axis to match SVG's.
  page.drawSvgPath(qr.svgPath, {
    x: placed.centreX,
    y: A4.height - placed.centreY,
    rotate: degrees(-placed.rotation || 0),
    scale: placed.scale,
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

  for (const poster of posters) {
    const page = pdf.addPage([A4.width, A4.height]);
    // Stretched to fill the page, which it's within a millimetre of.
    page.drawPage(embedded, { x: 0, y: 0, width: A4.width, height: A4.height });
    drawQrCode(page, design.qrPlacement, poster.scanUrl);
  }
  return (await pdf.save()) as Uint8Array<ArrayBuffer>;
}
