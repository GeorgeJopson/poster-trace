/**
 * A poster design's position in its campaign, counting from 0, in campaign
 * order (oldest first).
 */
export type DesignPosition = number;

/** A number of posters. */
export type PosterCount = number;

/**
 * How many scans of one design's posters happened in one scan slot: the 15
 * minutes from `slotStart`, which is on the quarter hour in UTC.
 */
export type ScanSlotDto = {
  position: DesignPosition;
  slotStart: Date;
  /** At least 1. */
  scanCount: number;
};

/** A campaign's scans since it was created, by design and scan slot. */
export type ScansOverTimeDto = {
  /** When the campaign was created, which is when it began. */
  createdAt: Date;
  /** How many designs the campaign has. Every slot's position is below it. */
  designCount: number;
  /** Only slots with scans, in no particular order. */
  slots: ScanSlotDto[];
};

/** A poster with one of a campaign's highest scan counts. */
export type TopPosterDto = {
  posterId: string;
  /** `null` if the poster isn't registered. */
  posterName: string | null;
  /** At least 1. */
  scanCount: number;
};

/** A located poster, as a point on the scan map. */
export type MapPosterDto = {
  posterId: string;
  latitude: number;
  longitude: number;
  scanCount: number;
};

/** Where a campaign's posters are and how much each has been scanned. */
export type ScanMapDto = {
  /** The campaign's located posters, including ones with no scans. */
  posters: MapPosterDto[];
  /** The highest scan count of `posters`, or 0 if it's empty. */
  maxScanCount: number;
  /**
   * How many of the campaign's posters aren't on the map, because they're
   * unregistered or registered without a location.
   */
  unmappedPosterCount: PosterCount;
  /** How many posters the campaign has, registered or not. */
  posterCount: PosterCount;
};

/** What the analytics show for a campaign. */
export type CampaignAnalyticsDto =
  /** No posters have been generated from any of the campaign's designs. */
  | { kind: "noPosters" }
  | {
      kind: "posters";
      scansOverTime: ScansOverTimeDto;
      /**
       * Up to `AnalyticsService.TOP_POSTER_COUNT` posters with the most
       * scans, most first. Posters with no scans are left out, so it's empty
       * when nothing has been scanned. Posters with the same scan count are
       * ordered by id.
       */
      topPosters: TopPosterDto[];
      scanMap: ScanMapDto;
    };
