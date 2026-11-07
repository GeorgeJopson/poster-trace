import { getScanService } from "@di/container";

// Where every poster's QR code points (see ADR-0014). Anyone can scan a
// poster, so there's no session check.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/redirect/[posterId]">,
) {
  const { posterId } = await ctx.params;
  const target = await getScanService().findTarget(posterId);
  if (!target) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: target,
      // Every scan must reach the server, so it gets the campaign's current
      // target and can be recorded.
      "Cache-Control": "no-store",
    },
  });
}
