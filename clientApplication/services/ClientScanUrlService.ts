import { PosterId } from "@domain/poster/PosterId";

/** Stands in for a poster's id in previews: a UUID, like every real one. */
const SAMPLE_POSTER_ID = PosterId.from("00000000-0000-0000-0000-000000000000");

/** The poster id at the end of a scan URL. */
const SCAN_URL_END = /\/redirect\/([^/?#]+)$/;

/**
 * Scan URLs: the web address in each poster's QR code, which can never
 * change (ADR-0014). Pure and browser-safe, so the server builds them and the
 * browser reads them with the same rules.
 */
export class ClientScanUrlService {
  /** The poster's scan URL, on the site served from `baseUrl`. */
  static build(baseUrl: string, posterId: PosterId): string {
    return new URL(`/redirect/${posterId}`, baseUrl).href;
  }

  /** A scan URL for previews, the same length as a real poster's. */
  static buildSample(baseUrl: string): string {
    return ClientScanUrlService.build(baseUrl, SAMPLE_POSTER_ID);
  }

  /**
   * The poster id in `text` if it's exactly one of `baseUrl`'s scan URLs,
   * else `null`. Only checks the shape: the poster may not exist.
   */
  static parse(text: string, baseUrl: string): PosterId | null {
    const match = SCAN_URL_END.exec(text);
    const posterId = match && PosterId.parse(match[1]);
    // Anything but exactly what `build` makes (another origin, a query, a
    // hash, a trailing slash) wasn't made by Poster Trace.
    if (!posterId || text !== ClientScanUrlService.build(baseUrl, posterId)) {
      return null;
    }
    return posterId;
  }
}
