import { describe, expect, it } from "vitest";

import { PosterId } from "@domain/poster/PosterId";
import { Scan } from "@domain/scan/Scan";
import { ScanId } from "@domain/scan/ScanId";

describe("Scan.record", () => {
  const posterId = PosterId.generate();
  const scannedAt = new Date("2026-11-07T12:00:00Z");

  it("records a scan of the poster at the time it happened, with its own id", () => {
    const scan = Scan.record(posterId, scannedAt);

    expect(scan.posterId).toBe(posterId);
    expect(scan.scannedAt).toEqual(scannedAt);
    expect(ScanId.parse(scan.id)).toBe(scan.id);
  });

  it("gives every scan its own id, including repeats", () => {
    const first = Scan.record(posterId, scannedAt);
    const second = Scan.record(posterId, scannedAt);

    expect(first.id).not.toBe(second.id);
  });
});
