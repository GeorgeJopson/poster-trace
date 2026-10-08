import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

// The only module that talks to Netlify Blobs. The database stores the key
// returned by saveImage; everything else goes through these functions.
//
// Not marked "server-only": the seed script (run with tsx) uses it too.

// Site-wide, so images survive across deploys. Strong consistency so an
// image can be read back straight after it's uploaded.
function getImageStore() {
  return getStore({ name: "poster-designs", consistency: "strong" });
}

export async function saveImage(image: Blob) {
  const key = crypto.randomUUID();
  await getImageStore().set(key, await image.arrayBuffer(), {
    metadata: { contentType: image.type },
  });
  return key;
}

export async function getImage(key: string) {
  const entry = await getImageStore().getWithMetadata(key, {
    type: "arrayBuffer",
  });
  if (!entry) return null;
  return {
    data: entry.data,
    contentType: String(entry.metadata.contentType),
  };
}

export async function deleteImage(key: string) {
  // The store is shared by every deploy context, but deploy previews get
  // their own copy of the database. A delete from a preview could remove
  // an image production still references, so only production deletes.
  // Locally (context "dev", or unset outside `netlify dev`) the store is a
  // sandbox that's safe to delete from.
  const context = process.env.NETLIFY_CONTEXT;
  if (context && context !== "production" && context !== "dev") return;
  await getImageStore().delete(key);
}
