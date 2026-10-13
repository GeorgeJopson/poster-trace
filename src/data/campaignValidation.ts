// Validation rules shared by the campaign forms (client side) and
// @/data/campaigns, which enforces them on every write, so they can't drift
// apart. This is kept separate from @/data/campaigns, as that module is
// server-only.

/**
 * The longest target URL allowed. Every poster's QR code encodes the target,
 * and a QR code can only hold so much: at our error correction level, much
 * more than this won't fit.
 */
export const MAX_TARGET_LENGTH = 1000;

/**
 * The target new campaigns start with, and the one QR codes fall back to for
 * a campaign saved with an empty target (before targets were validated), as
 * a QR code can't encode an empty string.
 */
export const DEFAULT_TARGET = "https://www.campaigns.com";

/** Returns why `target` can't be used as a campaign's URL, or null if it can. */
export function getTargetError(target: string): string | null {
  if (target.trim() === "") {
    return "Please enter a target URL.";
  }
  // The QR code stores the URL as UTF-8, where a non-ASCII character takes
  // several bytes, so count bytes rather than characters. For a plain ASCII
  // URL the two are the same.
  if (new TextEncoder().encode(target).length > MAX_TARGET_LENGTH) {
    return `The target URL is too long. It can be up to ${MAX_TARGET_LENGTH} characters, and some characters, like accented letters, count as more than one.`;
  }
  return null;
}

export type CampaignFields = { name: string; target: string };

/**
 * Checks a campaign's fields before they're saved, returning them tidied up
 * (the target trimmed), or throwing if they aren't valid.
 */
export function validateCampaignFields(data: CampaignFields): CampaignFields {
  const target = data.target.trim();
  const targetError = getTargetError(target);
  if (targetError) {
    throw new Error(targetError);
  }
  return { ...data, target };
}
