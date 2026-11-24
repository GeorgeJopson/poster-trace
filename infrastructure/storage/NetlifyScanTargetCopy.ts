import type { ScanTargetCopy } from "@application/ports/ScanTargetCopy";
import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

import type { ScanTargetKeys } from "./OrphanedScanTargetCleanup";
import { scanTargetStore } from "./scanTargetStore";

/**
 * Each poster's target in Netlify Blobs, for the scan redirect to read
 * before the database (ADR-0020). Each key is a poster id, and its value is
 * the target as plain text. Its keys are listed and deleted by
 * OrphanedScanTargetCleanup.
 */
export class NetlifyScanTargetCopy implements ScanTargetCopy, ScanTargetKeys {
  /**
   * How many writes are sent at once. A campaign's posters are all rewritten
   * when its target is saved, which could be thousands of writes.
   */
  private static readonly CONCURRENT_WRITES = 20;

  /** The copy for this process's deploy context. */
  static forThisContext(): NetlifyScanTargetCopy {
    return new NetlifyScanTargetCopy(process.env.NETLIFY_CONTEXT);
  }

  constructor(private readonly netlifyContext: string | undefined) {}

  async copy(
    posterIds: readonly PosterId[],
    target: CampaignTarget,
  ): Promise<void> {
    // Looked up on every call rather than once: it reads the Blobs
    // credentials from the environment, and this object lives for the whole
    // process.
    const store = scanTargetStore(this.netlifyContext);
    const remaining = [...posterIds];
    // Each worker writes one poster at a time until none are left.
    const writeNext = async (): Promise<void> => {
      for (let id = remaining.pop(); id; id = remaining.pop()) {
        await store.set(id, target.value);
      }
    };
    await Promise.all(
      Array.from(
        { length: NetlifyScanTargetCopy.CONCURRENT_WRITES },
        writeNext,
      ),
    );
  }

  /** Every copied key, which should each be a poster id. */
  async list(): Promise<string[]> {
    const keys: string[] = [];
    for await (const { blobs } of scanTargetStore(this.netlifyContext).list({
      paginate: true,
    })) {
      keys.push(...blobs.map(({ key }) => key));
    }
    return keys;
  }

  async delete(key: string): Promise<void> {
    await scanTargetStore(this.netlifyContext).delete(key);
  }
}
