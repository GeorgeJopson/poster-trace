import { getStore } from "@netlify/blobs";

import type { ScanTargetCopy } from "@application/ports/ScanTargetCopy";
import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

// Not marked "server-only": the backfill script (run with tsx) uses it too.

/**
 * Prototype: each poster's target in Netlify Blobs, keyed by poster id with
 * the target as plain text, for the scan redirect to read before the
 * database. The redirect opens the same store itself (it can't import this),
 * so keep in step with netlify/edge-functions/redirect.ts:
 * - REGION with SCAN_TARGET_REGION
 * - storeName with scanTargetStoreName
 */
export class NetlifyScanTargetCopy implements ScanTargetCopy {
  /**
   * The closest Blobs region to the site's functions (London). A site-wide
   * store defaults to us-east-2 rather than following the functions region,
   * so every call names it, or that side silently sees an empty store.
   */
  static readonly REGION = "eu-central-1";

  /** How many writes to send at once. */
  private static readonly CONCURRENT_WRITES = 20;

  /**
   * A site-wide store rather than a deploy store, which would start empty on
   * every production deploy. Site-wide stores are shared by every deploy
   * context, but deploy previews get their own copy of the database, so the
   * context is in the name. Locally (context "dev" under `netlify dev`, or ""
   * outside it) it's "dev".
   */
  static storeName(netlifyContext?: string): string {
    return `scan-targets-${netlifyContext || "dev"}`;
  }

  /** The store for this process's deploy context. */
  static forThisContext(): NetlifyScanTargetCopy {
    return new NetlifyScanTargetCopy(
      NetlifyScanTargetCopy.storeName(process.env.NETLIFY_CONTEXT),
    );
  }

  constructor(private readonly storeName: string) {}

  async copy(
    posterIds: readonly PosterId[],
    target: CampaignTarget,
  ): Promise<void> {
    const store = this.getStore();
    const { CONCURRENT_WRITES } = NetlifyScanTargetCopy;
    for (let i = 0; i < posterIds.length; i += CONCURRENT_WRITES) {
      await Promise.all(
        posterIds
          .slice(i, i + CONCURRENT_WRITES)
          .map((id) => store.set(id, target.value)),
      );
    }
  }

  // Looked up on every call rather than once: getStore() reads the Blobs
  // credentials from the environment, and this class lives for the whole
  // process.
  private getStore() {
    return getStore({
      name: this.storeName,
      region: NetlifyScanTargetCopy.REGION,
    });
  }
}
