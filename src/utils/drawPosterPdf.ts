import {
  concatTransformationMatrix,
  degrees,
  drawObject,
  popGraphicsState,
  pushGraphicsState,
  PDFDocument,
  PDFEmbeddedPage,
  rgb,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

import type { PosterDto } from "@application/dto/PosterDto";
import type { QrPlacementDto } from "@application/dto/PosterDesignDto";
import {
  PosterDesignImageRules,
  type PosterDesignImageType,
} from "@domain/campaign/design/PosterDesignImageRules";

import { createQrModules, type QrModules } from "./drawPoster";
import jpegOrientation, { type Orientation } from "./jpegOrientation";

/** An A4 page in PDF points (1/72 inch), portrait. */
export const A4 = { width: 595.28, height: 841.89 } as const;

export type PosterPdfDesign = {
  /** The design's image: a PNG, a JPEG or a one-page PDF. */
  data: Uint8Array | ArrayBuffer;
  contentType: PosterDesignImageType;
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

/** A transformation matrix, `[a b c d e f]` as PDFs write them. */
type Matrix = [number, number, number, number, number, number];

/** `first`, then `second`. */
function multiply(first: Matrix, second: Matrix): Matrix {
  const [a, b, c, d, e, f] = first;
  const [A, B, C, D, E, F] = second;
  return [
    a * A + b * C,
    a * B + b * D,
    c * A + d * C,
    c * B + d * D,
    e * A + f * C + E,
    e * B + f * D + F,
  ];
}

/**
 * Maps the unit square of the stored content onto the unit square shown
 * upright, for each EXIF orientation. Both have y going up, as in PDFs.
 */
const ORIENTATION_MATRICES: Record<Orientation, Matrix> = {
  1: [1, 0, 0, 1, 0, 0],
  2: [-1, 0, 0, 1, 1, 0], // Mirrored left to right
  3: [-1, 0, 0, -1, 1, 1], // Turned 180°
  4: [1, 0, 0, -1, 0, 1], // Mirrored top to bottom
  5: [0, -1, -1, 0, 1, 1], // Mirrored along the top-left diagonal
  6: [0, -1, 1, 0, 0, 1], // Turned 90° clockwise
  7: [0, 1, 1, 0, 0, 0], // Mirrored along the top-right diagonal
  8: [0, 1, -1, 0, 1, 0], // Turned 90° anticlockwise
};

/** A PDF page's /Rotate, which turns it clockwise, as an orientation. */
const PAGE_ROTATIONS: Record<number, Orientation> = {
  0: 1,
  90: 6,
  180: 3,
  270: 8,
};

type EmbeddedDesign = {
  xObject: PDFImage | PDFEmbeddedPage;
  /** How to turn the stored content to show it as the preview does. */
  orientation: Orientation;
};

/** The design's size as it's shown: turned, if its orientation says so. */
function shownSize({ xObject, orientation }: EmbeddedDesign): Size {
  return orientation >= 5
    ? { width: xObject.height, height: xObject.width }
    : { width: xObject.width, height: xObject.height };
}

/**
 * Embeds the design as the preview shows it: a JPEG turned upright by its
 * EXIF orientation, as browsers do, and a PDF page cut to its CropBox and
 * turned by its /Rotate, as pdf.js does.
 */
async function embedDesign(
  pdf: PDFDocument,
  design: PosterPdfDesign,
): Promise<EmbeddedDesign> {
  switch (design.contentType) {
    case PosterDesignImageRules.PNG_TYPE:
      return { xObject: await pdf.embedPng(design.data), orientation: 1 };
    case PosterDesignImageRules.JPEG_TYPE:
      return {
        xObject: await pdf.embedJpg(design.data),
        orientation: jpegOrientation(new Uint8Array(design.data)),
      };
    case PosterDesignImageRules.PDF_TYPE: {
      const source = await PDFDocument.load(design.data, {
        updateMetadata: false,
      });
      const page = source.getPage(0);
      const crop = page.getCropBox();
      // Embedded as a vector page, so it prints at full quality.
      const xObject = await pdf.embedPage(page, {
        left: crop.x,
        bottom: crop.y,
        right: crop.x + crop.width,
        top: crop.y + crop.height,
      });
      const rotation = ((page.getRotation().angle % 360) + 360) % 360;
      return { xObject, orientation: PAGE_ROTATIONS[rotation] ?? 1 };
    }
    default: {
      // Fails to compile if a format is added without a case here.
      const unhandled: never = design.contentType;
      throw new Error(`Can't make posters from a ${unhandled} design`);
    }
  }
}

/** Draws the design into the layout's box, the way up it's shown. */
function drawDesign(
  page: PDFPage,
  design: EmbeddedDesign,
  layout: PosterLayout,
) {
  const { xObject, orientation } = design;
  const box = layout.design;
  const isImage = !(xObject instanceof PDFEmbeddedPage);
  // An image fills the unit square; an embedded page fills its own size.
  const toUnitSquare: Matrix = isImage
    ? [1, 0, 0, 1, 0, 0]
    : [1 / xObject.width, 0, 0, 1 / xObject.height, 0, 0];
  const matrix = multiply(
    multiply(toUnitSquare, ORIENTATION_MATRICES[orientation]),
    [box.width, 0, 0, box.height, box.x, box.y],
  );
  const name = page.node.newXObject(
    isImage ? "Image" : "EmbeddedPdfPage",
    xObject.ref,
  );
  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(...matrix),
    drawObject(name),
    popGraphicsState(),
  );
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
  posters: readonly Pick<PosterDto, "scanUrl">[],
): Promise<Uint8Array<ArrayBuffer>> {
  const pdf = await PDFDocument.create();
  const embedded = await embedDesign(pdf, design);
  const layout = layoutPoster(shownSize(embedded), design.qrPlacement);

  for (const poster of posters) {
    const page = pdf.addPage([A4.width, A4.height]);
    drawDesign(page, embedded, layout);
    drawQrCode(page, layout, poster.scanUrl);
  }
  return (await pdf.save()) as Uint8Array<ArrayBuffer>;
}
