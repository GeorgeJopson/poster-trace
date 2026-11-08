/**
 * How many of each design's posters have a given scan count. `posters` has
 * every design of the campaign, keyed by design id.
 */
export type ScanDistributionRowDto = {
  scanCount: number;
  posters: Record<string, number>;
};

/** A poster with one of a campaign's highest scan counts. */
export type TopPosterDto = {
  posterId: string;
  designId: string;
  scanCount: number;
};
