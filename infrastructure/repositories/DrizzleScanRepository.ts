import type { Scan } from "@domain/scan/Scan";
import type { ScanRepository } from "@domain/scan/ScanRepository";

import type { Db } from "../db/client";
import { FOREIGN_KEY_VIOLATION, hasPgCode } from "../db/pgErrors";
import { scan as scanTable } from "../db/schema";

export class DrizzleScanRepository implements ScanRepository {
  constructor(private readonly db: Db) {}

  async add(scan: Scan): Promise<void> {
    // Every scan runs this, so it's a single insert with no check that the
    // poster exists first (see ADR-0017).
    try {
      await this.db.insert(scanTable).values({
        id: scan.id,
        posterId: scan.posterId,
        scannedAt: scan.scannedAt,
      });
    } catch (error) {
      // The poster was deleted since the redirect, and its scans would have
      // been deleted with it, so the scan is skipped (ADR-0017).
      if (hasPgCode(error, FOREIGN_KEY_VIOLATION)) return;
      throw error;
    }
  }
}
