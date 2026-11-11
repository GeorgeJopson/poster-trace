import "server-only";

import { PosterId } from "@domain/poster/PosterId";
import { Scan } from "@domain/scan/Scan";
import type { ScanRepository } from "@domain/scan/ScanRepository";

import type { ScanTargetLookup } from "../ports/ScanTargetLookup";

/**
 * Scans of posters' QR codes. Anyone can scan a poster, so nothing here
 * checks who's signed in.
 */
export class ScanService {
  constructor(
    private readonly targets: ScanTargetLookup,
    private readonly scans: ScanRepository,
  ) {}

  /**
   * The URL a scan of the poster sends the scanner to, or `null` if there's
   * no such poster.
   */
  async findTarget(posterId: string): Promise<string | null> {
    const id = PosterId.parse(posterId);
    const target = id && (await this.targets.findTarget(id));
    return target ? target.value : null;
  }

  /**
   * Records a scan of the poster that happened at `scannedAt`. It runs after
   * the scanner has been redirected, so it never throws: a scan that can't be
   * recorded is logged and lost (see ADR-0015). The poster isn't loaded
   * (see ADR-0017), and nothing is recorded if there's no such poster, e.g.
   * because it was deleted since the redirect.
   */
  async recordScan(posterId: string, scannedAt: Date): Promise<void> {
    try {
      const id = PosterId.parse(posterId);
      if (!id) return;
      await this.scans.add(Scan.record(id, scannedAt));
    } catch (error) {
      console.error(`Couldn't record a scan of poster ${posterId}`, error);
    }
  }
}
