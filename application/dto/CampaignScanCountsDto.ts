/** How many scans a campaign's posters have had, grouped by poster design. */
export type CampaignScanCountsDto = {
  /** Scans of all the campaign's posters. */
  scanCount: number;
  /** The campaign's poster designs, oldest first. */
  posterDesigns: PosterDesignScanCountsDto[];
};

export type PosterDesignScanCountsDto = {
  id: string;
  /** Scans of all the design's posters. */
  scanCount: number;
  posters: PosterScanCountDto[];
};

export type PosterScanCountDto = {
  id: string;
  scanCount: number;
};
