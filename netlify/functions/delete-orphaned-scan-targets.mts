import { getDb } from "../../infrastructure/db/client";
import { NetlifyScanTargetCopy } from "../../infrastructure/storage/NetlifyScanTargetCopy";
import { OrphanedScanTargetCleanup } from "../../infrastructure/storage/OrphanedScanTargetCleanup";

// A Netlify scheduled function: it runs once a day, and only on the
// published production deploy. Deletes the copied scan targets of posters
// that no longer exist (ADR-0020). Only production's store needs it: every
// other deploy has a store of its own, which goes when the deploy does. It
// wires its own objects because di/container.ts is server-only, which only
// Next can import.

export default async function deleteOrphanedScanTargets() {
  const cleanup = new OrphanedScanTargetCleanup(
    getDb(),
    new NetlifyScanTargetCopy("production"),
  );
  const deleted = await cleanup.run();
  console.log(`Deleted ${deleted} orphaned scan target copies`);
}

export const config = { schedule: "@daily" };
