import { inArray } from "drizzle-orm";

import { isUuid } from "../../domain/shared/uuid";
import type { Db } from "../db/client";
import { poster } from "../db/schema";

/** The keys of the copied scan targets: poster ids, or so they should be. */
export interface ScanTargetKeys {
  list(): Promise<string[]>;
  delete(key: string): Promise<void>;
}

/**
 * Deletes the copied scan targets of posters that no longer exist: those of
 * deleted accounts, which take their campaigns, designs and posters with
 * them (ADR-0020). It runs once a day. Until it does, a scan of a deleted
 * poster still redirects to its old target, rather than showing the "poster
 * not found" page.
 *
 * There's no grace period, unlike OrphanedDesignImageCleanup's, because a
 * copy is only ever written after its poster's row is committed.
 */
export class OrphanedScanTargetCleanup {
  /** How many keys are checked against the database in one query. */
  private static readonly BATCH_SIZE = 1000;

  constructor(
    private readonly db: Db,
    private readonly copies: ScanTargetKeys,
  ) {}

  /** Returns how many copies were deleted. */
  async run(): Promise<number> {
    const keys = await this.copies.list();
    const { BATCH_SIZE } = OrphanedScanTargetCleanup;
    let deleted = 0;
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      for (const key of await this.orphans(batch)) {
        await this.copies.delete(key);
        deleted += 1;
      }
    }
    return deleted;
  }

  /** The keys in `keys` that aren't the id of a stored poster. */
  private async orphans(keys: string[]): Promise<string[]> {
    // A key that isn't a UUID can't be a poster, and would fail the query.
    const ids = keys.filter(isUuid);
    const stored =
      ids.length === 0
        ? []
        : await this.db
            .select({ id: poster.id })
            .from(poster)
            .where(inArray(poster.id, ids));
    const existing = new Set(stored.map(({ id }) => id));
    return keys.filter((key) => !existing.has(key));
  }
}
