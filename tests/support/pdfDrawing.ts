import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRawStream,
  type PDFPage,
} from "pdf-lib";

type Matrix = [number, number, number, number, number, number];

export type DrawnXObject = {
  /** The page-space box around it. */
  left: number;
  bottom: number;
  width: number;
  height: number;
};

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** `first` then `second`, in PDF's row-vector convention. */
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

function apply([a, b, c, d, e, f]: Matrix, [x, y]: [number, number]) {
  return [a * x + c * y + e, b * x + d * y + f] as const;
}

function numbers(array: PDFArray): number[] {
  return array.asArray().map((n) => (n as PDFNumber).asNumber());
}

function contentStreamText(page: PDFPage): string {
  const contents = page.node.Contents();
  const streams =
    contents instanceof PDFArray
      ? contents.asArray().map((ref) => page.doc.context.lookup(ref))
      : [contents];
  return streams
    .map((stream) =>
      new TextDecoder("latin1").decode(
        decodePDFRawStream(stream as PDFRawStream).decode(),
      ),
    )
    .join("\n");
}

/**
 * Where the first XObject (an image or an embedded page) drawn on `page`
 * lands, as the page-space box around it. Only understands the simple
 * content streams pdf-lib writes.
 */
export function drawnXObject(page: PDFPage): DrawnXObject {
  const stack: Matrix[] = [];
  let ctm = IDENTITY;
  const operands: string[] = [];
  for (const token of contentStreamText(page).split(/\s+/).filter(Boolean)) {
    if (/^[-+.\d]/.test(token) || token.startsWith("/")) {
      operands.push(token);
      continue;
    }
    if (token === "q") stack.push(ctm);
    else if (token === "Q") ctm = stack.pop() ?? IDENTITY;
    else if (token === "cm") {
      ctm = multiply(operands.slice(-6).map(Number) as Matrix, ctm);
    } else if (token === "Do") {
      return xObjectBox(page, operands.at(-1)!.slice(1), ctm);
    }
    operands.length = 0;
  }
  throw new Error("Nothing is drawn on the page");
}

/**
 * The points of every path drawn on `page`, in page space, in the order
 * they're drawn. Only understands the simple content streams pdf-lib writes,
 * built from `m` and `l`.
 */
export function drawnPathPoints(page: PDFPage): [number, number][] {
  const stack: Matrix[] = [];
  let ctm = IDENTITY;
  const operands: string[] = [];
  const points: [number, number][] = [];
  for (const token of contentStreamText(page).split(/\s+/).filter(Boolean)) {
    if (/^[-+.\d]/.test(token) || token.startsWith("/")) {
      operands.push(token);
      continue;
    }
    if (token === "q") stack.push(ctm);
    else if (token === "Q") ctm = stack.pop() ?? IDENTITY;
    else if (token === "cm") {
      ctm = multiply(operands.slice(-6).map(Number) as Matrix, ctm);
    } else if (token === "m" || token === "l") {
      const [x, y] = operands.slice(-2).map(Number);
      points.push([...apply(ctm, [x, y])]);
    }
    operands.length = 0;
  }
  return points;
}

function xObjectBox(page: PDFPage, name: string, ctm: Matrix): DrawnXObject {
  const xObjects = page.node
    .Resources()!
    .lookup(PDFName.of("XObject"), PDFDict);
  const { dict } = xObjects.lookup(PDFName.of(name)) as PDFRawStream;
  // An image's content is the unit square; a form's is its BBox.
  let [x0, y0, x1, y1] = [0, 0, 1, 1];
  let matrix = ctm;
  if (dict.lookup(PDFName.of("Subtype")) === PDFName.of("Form")) {
    [x0, y0, x1, y1] = numbers(dict.lookup(PDFName.of("BBox"), PDFArray));
    const formMatrix = dict.lookup(PDFName.of("Matrix"));
    if (formMatrix instanceof PDFArray) {
      matrix = multiply(numbers(formMatrix) as Matrix, ctm);
    }
  }
  const pointAt = (u: number, v: number) =>
    apply(matrix, [x0 + u * (x1 - x0), y0 + v * (y1 - y0)]);
  const points = [pointAt(0, 0), pointAt(1, 0), pointAt(0, 1), pointAt(1, 1)];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const bottom = Math.min(...ys);
  return {
    left,
    bottom,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - bottom,
  };
}
