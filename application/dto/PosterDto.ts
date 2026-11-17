/** A generated poster. */
export type PosterDto = {
  id: string;
  /**
   * The URL its QR code encodes. A scan opens it, which records the scan and
   * sends the scanner on to the campaign's target.
   */
  scanUrl: string;
};

/**
 * What the register page needs to know about a poster it has read: whether
 * Poster Trace recognises it and, if so, whether it's registered. It says
 * nothing about the registration itself.
 */
export type PosterCheckDto = "unknown" | "registered" | "unregistered";
