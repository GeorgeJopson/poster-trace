  import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setEnvironmentContext } from "@netlify/blobs";
import { BlobsServer } from "@netlify/blobs/server";

// For scripts run outside `netlify dev` (e.g. the seed script). Starts a
// Blobs server on the same files `netlify dev` uses for its sandboxed local
// store, so images saved here show up in the app. Returns a function that
// stops the server.
export async function connectToLocalImageStorage() {
  const netlifyDir = path.join(process.cwd(), ".netlify");
  // `netlify dev` keeps each site's blobs under its site ID.
  const { siteId } = JSON.parse(
    fs.readFileSync(path.join(netlifyDir, "state.json"), "utf8"),
  ) as { siteId: string };

  const token = crypto.randomUUID();
  const server = new BlobsServer({
    directory: path.join(netlifyDir, "blobs-serve"),
    token,
  });
  const { port } = await server.start();
  const url = `http://localhost:${port}`;

  setEnvironmentContext({
    deployID: "0",
    edgeURL: url,
    uncachedEdgeURL: url,
    primaryRegion: "dev",
    siteID: siteId,
    token,
  });

  return () => server.stop();
}
