import { getDb } from "../../infrastructure/db/client";
import { NetlifyBlobStore } from "../../infrastructure/storage/NetlifyBlobStore";
import { OrphanedDesignImageCleanup } from "../../infrastructure/storage/OrphanedDesignImageCleanup";

// A Netlify scheduled function: it runs once a day, and only on the
// published production deploy. Deletes poster design images that no design
// points to (ADR-0013). It wires its own objects because di/container.ts is
// server-only, which only Next can import.

export default async function deleteOrphanedDesignImages() {
  const cleanup = new OrphanedDesignImageCleanup(
    getDb(),
    NetlifyBlobStore.forPosterDesigns(),
  );
  const deleted = await cleanup.run();
  console.log(`Deleted ${deleted} orphaned poster design images`);
}

export const config = { schedule: "@daily" };
