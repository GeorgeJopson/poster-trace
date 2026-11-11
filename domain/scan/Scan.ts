import type { PosterId } from "../poster/PosterId";
import { ScanId } from "./ScanId";

export type ScanProps = {
  id: ScanId;
  posterId: PosterId;
  scannedAt: Date;
};

/**
 * One reading of a poster's QR code, at the time it happened. Its own
 * aggregate, outside Poster: it refers to its poster by id only, so recording
 * a scan never loads the poster (see ADR-0017).
 */
export class Scan {
  readonly id: ScanId;
  readonly posterId: PosterId;
  readonly scannedAt: Date;

  private constructor({ id, posterId, scannedAt }: ScanProps) {
    this.id = id;
    this.posterId = posterId;
    this.scannedAt = scannedAt;
  }

  /** A new scan of the poster that happened at `scannedAt`. */
  static create(posterId: PosterId, scannedAt: Date): Scan {
    return new Scan({ id: ScanId.generate(), posterId, scannedAt });
  }
}
