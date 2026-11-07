import { after } from "next/server";

import { getScanService } from "@di/container";

// Where every poster's QR code points (see ADR-0014). Anyone can scan a
// poster, so there's no session check.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/redirect/[posterId]">,
) {
  const scannedAt = new Date();
  const { posterId } = await ctx.params;
  const scanService = getScanService();
  const target = await scanService.findTarget(posterId);
  if (!target) {
    return new Response("Not found", { status: 404 });
  }

  // The scan is recorded after the scanner has been redirected, so they
  // never wait for it. A scan that fails to record is lost (see ADR-0015).
  after(() => scanService.recordScan(posterId, scannedAt));

  return new Response(null, {
    status: 307,
    headers: {
      Location: target,
      // Every scan must reach the server, so it gets the campaign's current
      // target and is recorded.
      "Cache-Control": "no-store",
    },
  });
}
