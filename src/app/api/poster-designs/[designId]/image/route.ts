import { getMyPosterDesignImageKey } from "@/data/campaigns";
import { getImage } from "@/imageStorage";

// Serves a poster design's image to the user who owns it. Blobs have no
// access control of their own, so this route is what keeps images private.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/poster-designs/[designId]/image">,
) {
  const { designId } = await ctx.params;
  const id = Number(designId);
  const key = Number.isInteger(id)
    ? await getMyPosterDesignImageKey(id)
    : undefined;
  const image = key && (await getImage(key));
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(image.data, {
    headers: {
      "Content-Type": image.contentType,
      // A design's image never changes, so the browser can keep it. Private
      // so shared caches never hold one user's image.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
