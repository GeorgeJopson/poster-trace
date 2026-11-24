import type { ScanTargetCopy } from "@application/ports/ScanTargetCopy";
import type { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

/** Keeps each poster's copied target. Every copy fails while `fail` is set. */
export class InMemoryScanTargetCopy implements ScanTargetCopy {
  readonly targets = new Map<PosterId, string>();
  fail = false;

  async copy(
    posterIds: readonly PosterId[],
    target: CampaignTarget,
  ): Promise<void> {
    if (this.fail) throw new Error("Couldn't copy the targets");
    for (const id of posterIds) this.targets.set(id, target.value);
  }
}
