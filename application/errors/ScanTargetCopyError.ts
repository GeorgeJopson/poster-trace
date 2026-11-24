/**
 * Thrown when a campaign's new target was saved, but couldn't be copied for
 * the scan redirect, so scans may still go to the old target (ADR-0020).
 * Saving the campaign again retries the copy. The message is user-facing.
 */
export class ScanTargetCopyError extends Error {
  constructor(options?: ErrorOptions) {
    super(
      "Your changes were saved, but your posters may still send scanners to the old target. Save again to retry.",
      options,
    );
    this.name = "ScanTargetCopyError";
  }
}
