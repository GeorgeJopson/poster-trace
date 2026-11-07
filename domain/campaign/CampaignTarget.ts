import { ValidationError } from "../shared/ValidationError";

/** The URL every one of a campaign's posters' QR codes sends people to. */
export class CampaignTarget {
  /**
   * The longest target allowed, in UTF-8 bytes: a sanity limit, well beyond
   * any real web address. QR codes encode the poster's scan URL rather than
   * the target (ADR-0014), so its length doesn't change the QR code. Stored
   * targets load through `create` (ADR-0006), so lowering this means checking
   * them first.
   */
  static readonly MAX_LENGTH = 1000;

  private constructor(readonly value: string) {}

  /** Trims `raw` and checks it's a web address of at most MAX_LENGTH bytes. */
  static create(raw: string): CampaignTarget {
    const value = raw.trim();
    if (value === "") {
      throw new ValidationError("Please enter a target URL.");
    }
    // Counted in UTF-8 bytes, where a non-ASCII character takes several, as
    // the URL is sent and stored. For a plain ASCII URL, bytes and characters
    // are the same.
    if (new TextEncoder().encode(value).length > CampaignTarget.MAX_LENGTH) {
      throw new ValidationError(
        `The target URL is too long. It can be up to ${CampaignTarget.MAX_LENGTH} characters, and some characters, like accented letters, count as more than one.`,
      );
    }
    // Every poster's scan redirects people here, so only allow web addresses
    // (not e.g. javascript: or file: URLs).
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new ValidationError(
        "Please enter a full URL, starting with https://.",
      );
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new ValidationError(
        "The target URL must start with http:// or https://.",
      );
    }
    return new CampaignTarget(value);
  }
}
