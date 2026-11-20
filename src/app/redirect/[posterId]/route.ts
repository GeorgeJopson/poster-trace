import { after } from "next/server";

import { getScanService } from "@di/container";

// Whether this function instance has already handled a scan. It starts false
// in every new instance, so the first scan an instance handles is marked as
// cold in its Server-Timing header.
let warm = false;

// Where every poster's QR code points (see ADR-0014). Anyone can scan a
// poster, so there's no session check.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/redirect/[posterId]">,
) {
  const start = performance.now();
  const cold = !warm;
  warm = true;

  const scannedAt = new Date();
  const { posterId } = await ctx.params;
  const scanService = getScanService();
  const lookupStart = performance.now();
  const target = await scanService.findTarget(posterId);
  const lookup = performance.now() - lookupStart;

  // How long the handler spent, so slow scans can be traced to the database
  // lookup or to the rest of the request (see scripts/time-redirect.sh).
  // Only durations are sent, never anything about the poster or campaign.
  const serverTiming = [
    `lookup;dur=${lookup.toFixed(1)};desc="Target lookup"`,
    `total;dur=${(performance.now() - start).toFixed(1)};desc="Handler"`,
    ...(cold ? [`cold;desc="First scan on this instance"`] : []),
  ].join(", ");

  if (!target) {
    return new Response("Not found", {
      status: 404,
      headers: { "Server-Timing": serverTiming },
    });
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
      "Server-Timing": serverTiming,
    },
  });
}
