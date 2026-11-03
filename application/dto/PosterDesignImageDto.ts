import type { PosterDesignImageContent } from "@domain/campaign/design/PosterDesignImageContent";

/**
 * A poster design's image, as a stream. Only the image route handler uses it,
 * passing the stream straight to its response, so it isn't copied.
 */
export type PosterDesignImageDto = PosterDesignImageContent;
