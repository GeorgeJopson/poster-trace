import { PosterDesignId } from "./PosterDesignId";
import type { PosterDesignImage } from "./PosterDesignImage";
import type { QrPlacement } from "./QrPlacement";

/** Fetches a stored design's image, or `null` if it's missing. */
export type PosterDesignImageLoader = () => Promise<PosterDesignImage | null>;

export type PosterDesignProps = {
  id: PosterDesignId;
  qrPlacement: QrPlacement;
  /** How a restored design fetches its image, when it's first needed. */
  loadImage: PosterDesignImageLoader;
};

/**
 * A design for a campaign's posters: an image with a QR code placed on it.
 * Part of the Campaign aggregate. A new design holds the image it was created
 * with; a restored one loads it on first use, as it can be large.
 */
export class PosterDesign {
  readonly id: PosterDesignId;
  readonly qrPlacement: QrPlacement;
  private readonly loader: PosterDesignImageLoader;
  private loading?: Promise<PosterDesignImage>;

  private constructor(
    { id, qrPlacement, loadImage }: PosterDesignProps,
    private loadedImage?: PosterDesignImage,
  ) {
    this.id = id;
    this.qrPlacement = qrPlacement;
    this.loader = loadImage;
  }

  /**
   * The design's image if it's in memory: given to `create`, or already
   * loaded. `undefined` until a restored design's image is loaded.
   */
  get image(): PosterDesignImage | undefined {
    return this.loadedImage;
  }

  /**
   * The design's image, fetched on the first call and kept after that.
   * Throws if a stored design's image is missing.
   */
  loadImage(): Promise<PosterDesignImage> {
    if (this.loadedImage) return Promise.resolve(this.loadedImage);
    return (this.loading ??= this.fetchImage());
  }

  /** A new design with a generated id. Only `Campaign.addDesign` calls this. */
  static create(
    qrPlacement: QrPlacement,
    image: PosterDesignImage,
  ): PosterDesign {
    return new PosterDesign(
      {
        id: PosterDesignId.generate(),
        qrPlacement,
        loadImage: async () => image,
      },
      image,
    );
  }

  /** Rebuilds a stored design. Only repositories call this. */
  static restore(props: PosterDesignProps): PosterDesign {
    return new PosterDesign(props);
  }

  private async fetchImage(): Promise<PosterDesignImage> {
    try {
      const image = await this.loader();
      if (!image) throw new Error("Poster design image is missing");
      this.loadedImage = image;
      return image;
    } finally {
      // A failed load can be retried.
      this.loading = undefined;
    }
  }
}
