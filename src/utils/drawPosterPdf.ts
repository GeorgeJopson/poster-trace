import {
  degrees,
  PDFDocument,
  PDFEmbeddedPage,
  rgb,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

import type { PosterDto } from "@application/dto/PosterDto";
import type { QrPlacementDto } from "@application/dto/PosterDesignDto";
import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";

import { createQrModules, type QrModules } from "./drawPoster";

/** An A4 page in PDF points (1/72 inch), portrait. */
export const A4 = { width: 595.28, height: 841.89 } as const;

export type PosterPdfDesign = {
  /** The design's image: a PNG, a JPEG or a one-page PDF. */
  data: Uint8Array | ArrayBuffer;
  contentType: string;
  qrPlacement: QrPlacementDto;
};

type Size = { width: number; height: number };

/** Where things go on the page, in PDF points from its bottom-left corner. */
export type PosterLayout = {
  design: { x: number; y: number; width: number; height: number };
  qr: {
    centreX: number;
    centreY: number;
    /** The QR code's width on the page. */
    size: number;
    /** Points per design unit, which the QR code's path is drawn in. */
    scale: number;
    /** Degrees anticlockwise, as PDFs measure them. */
    rotation: number;
  };
};

/**
 * Fits the design inside an A4 page, keeping its shape and centring it, so
 * the whole design shows with blank margins on two sides if it isn't
 * A4-shaped. The QR placement is relative to the design (see QrPlacement), so
 * it's scaled with it.
 */
export function layoutPoster(
  designSize: Size,
  qrPlacement: QrPlacementDto,
): PosterLayout {
  const scale = Math.min(
    A4.width / designSize.width,
    A4.height / designSize.height,
  );
  const width = designSize.width * scale;
  const height = designSize.height * scale;
  const x = (A4.width - width) / 2;
  const y = (A4.height - height) / 2;

  // QR placement is measured from the design's top-left corner, downwards,
  // but PDF y coordinates go up from the bottom.
  const size = (qrPlacement.size / 100) * width;
  const left = (qrPlacement.x / 100) * width;
  const top = (qrPlacement.y / 100) * height;
  return {
    design: { x, y, width, height },
    qr: {
      centreX: x + left + size / 2,
      centreY: y + height - top - size / 2,
      size,
      scale,
      // The preview turns it clockwise. `|| 0` avoids -0.
      rotation: -qrPlacement.rotation || 0,
    },
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

async function embedDesign(
  pdf: PDFDocument,
  design: PosterPdfDesign,
): Promise<PDFImage | PDFEmbeddedPage> {
  switch (design.contentType) {
    case PosterDesignImageRules.PNG_TYPE:
      return pdf.embedPng(design.data);
    case PosterDesignImageRules.JPEG_TYPE:
      return pdf.embedJpg(design.data);
    case PosterDesignImageRules.PDF_TYPE: {
      // Embedded as a vector page, so it prints at full quality.
      const [page] = await pdf.embedPdf(design.data, [0]);
      return page;
    }
    default:
      throw new Error(`Can't make posters from a ${design.contentType} design`);
  }
}

function drawQrCode(page: PDFPage, layout: PosterLayout, url: string) {
  const { qr } = layout;
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
  posters: readonly Pick<PosterDto, "redirectUrl">[],
): Promise<Uint8Array<ArrayBuffer>> {
  const pdf = await PDFDocument.create();
  const embedded = await embedDesign(pdf, design);
  const layout = layoutPoster(embedded, design.qrPlacement);

  for (const poster of posters) {
    const page = pdf.addPage([A4.width, A4.height]);
    if (embedded instanceof PDFEmbeddedPage) {
      page.drawPage(embedded, layout.design);
    } else {
      page.drawImage(embedded, layout.design);
    }
    drawQrCode(page, layout, poster.redirectUrl);
  }
  return (await pdf.save()) as Uint8Array<ArrayBuffer>;
}
