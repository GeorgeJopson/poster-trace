/** A poster design's id, as a plain string for the presentation layer. */
export type DesignId = string;

/** A number of posters. */
export type PosterCount = number;

/**
 * How many of each design's posters have a given scan count. `posterCountByDesign` has
 * every design of the campaign.
 */
export type ScanDistributionBucketDto = {
  scanCount: number;
  posterCountByDesign: Record<DesignId, PosterCount>;
};

/** A poster with one of a campaign's highest scan counts. */
export type TopPosterDto = {
  posterId: string;
  designId: DesignId;
  scanCount: number;
};
