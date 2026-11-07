import type { ScanId } from "./ScanId";

/** One reading of a poster's QR code, at the time it happened. */
export type Scan = {
  readonly id: ScanId;
  readonly scannedAt: Date;
};
