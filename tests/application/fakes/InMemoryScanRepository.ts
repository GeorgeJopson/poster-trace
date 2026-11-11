import type { PosterId } from "@domain/poster/PosterId";
import type { Scan } from "@domain/scan/Scan";
import type { ScanId } from "@domain/scan/ScanId";
import type { ScanRepository } from "@domain/scan/ScanRepository";

import type { InMemoryPosterRepository } from "./InMemoryPosterRepository";

/** Behaves like DrizzleScanRepository, storing the scans' values. */
export class InMemoryScanRepository implements ScanRepository {
  readonly scans: { id: ScanId; posterId: PosterId; scannedAt: Date }[] = [];

  /** `posters` stands in for the scan table's foreign key. */
  constructor(private readonly posters: InMemoryPosterRepository) {}

  async add({ id, posterId, scannedAt }: Scan): Promise<void> {
    // A scan of a poster that isn't stored is skipped, like the foreign key
    // violation DrizzleScanRepository ignores.
    if (!this.posters.posters.some((poster) => poster.id === posterId)) return;
    // Only inserts, so a duplicate id fails like the primary key would.
    if (this.scans.some((scan) => scan.id === id)) {
      throw new Error(`Duplicate scan ${id}`);
    }
    this.scans.push({ id, posterId, scannedAt });
  }
}
