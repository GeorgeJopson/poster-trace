/**
 * A poster design's image, coming out of the repository. A stream, so it can
 * be passed on as it arrives rather than held in memory.
 */
export type PosterDesignImageContent = {
  readonly data: ReadableStream;
  readonly contentType: string;
};
