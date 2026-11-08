/**
 * A poster design's position in its campaign, counting from 0, in campaign
 * order (oldest first).
 */
export type DesignPosition = number;

/** A number of posters. */
export type PosterCount = number;

/**
 * One poster design's share of the scan distribution: `posterCounts[n]` is
 * how many of its posters have `n` scans.
 */
export type DesignScanDistributionDto = {
  position: DesignPosition;
  posterCounts: PosterCount[];
};

/** A poster with one of a campaign's highest scan counts. */
export type TopPosterDto = {
  posterId: string;
  designPosition: DesignPosition;
  /** At least 1. */
  scanCount: number;
};

/** What the analytics show for a campaign. */
export type CampaignAnalyticsDto =
  /** No posters have been generated from any of the campaign's designs. */
  | { kind: "noPosters" }
  | {
      kind: "posters";
      /**
       * Every design of the campaign, in campaign order. Every
       * `posterCounts` has the same length, one more than the highest scan
       * count, and a design with no posters has all zeros.
       */
      scanDistribution: DesignScanDistributionDto[];
      /**
       * Up to `AnalyticsService.TOP_POSTER_COUNT` posters with the most
       * scans, most first. Posters with no scans are left out, so it's empty
       * when nothing has been scanned. Posters with the same scan count are
       * ordered by id.
       */
      topPosters: TopPosterDto[];
    };
