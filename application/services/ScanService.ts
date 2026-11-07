import "server-only";

import { PosterId } from "@domain/poster/PosterId";

import type { ScanTargetLookup } from "../ports/ScanTargetLookup";

/**
 * Scans of posters' QR codes. Anyone can scan a poster, so nothing here
 * checks who's signed in.
 */
export class ScanService {
  constructor(private readonly targets: ScanTargetLookup) {}

  /**
   * The URL a scan of the poster sends the scanner to, or `null` if there's
   * no such poster.
   */
  async findTarget(posterId: string): Promise<string | null> {
    const id = PosterId.parse(posterId);
    const target = id && (await this.targets.findTarget(id));
    return target ? target.value : null;
  }
}
