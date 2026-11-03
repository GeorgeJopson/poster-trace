import { ValidationError } from "../shared/ValidationError";

/** The URL every one of a campaign's posters' QR codes sends people to. */
export class CampaignTarget {
  /**
   * The longest target allowed, in UTF-8 bytes. Every poster's QR code
   * encodes the target, and a QR code can only hold so much: at our error
   * correction level, much more than this won't fit.
   */
  static readonly MAX_LENGTH = 1000;

  private constructor(readonly value: string) {}

  /** Trims `raw` and checks it's a web address that fits in a QR code. */
  static create(raw: string): CampaignTarget {
    const value = raw.trim();
    if (value === "") {
      throw new ValidationError("Please enter a target URL.");
    }
    // The QR code stores the URL as UTF-8, where a non-ASCII character takes
    // several bytes, so count bytes rather than characters. For a plain ASCII
    // URL the two are the same.
    if (new TextEncoder().encode(value).length > CampaignTarget.MAX_LENGTH) {
      throw new ValidationError(
        `The target URL is too long. It can be up to ${CampaignTarget.MAX_LENGTH} characters, and some characters, like accented letters, count as more than one.`,
      );
    }
    // Every poster's QR code sends people here, so only allow web addresses
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
