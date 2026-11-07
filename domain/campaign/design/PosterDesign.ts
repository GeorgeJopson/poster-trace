import { PosterDesignId } from "./PosterDesignId";
import type { PosterDesignImage } from "./PosterDesignImage";
import type { QrPlacement } from "./QrPlacement";

/** Fetches a stored design's image, or `null` if it's missing. */
export type PosterDesignImageLoader = () => Promise<PosterDesignImage | null>;

export type PosterDesignProps = {
  id: PosterDesignId;
  qrPlacement: QrPlacement;
  /** How a restored design fetches its image, when it's first needed. */
  imageLoader: PosterDesignImageLoader;
};

/**
 * A design for a campaign's posters: an image with a QR code placed on it.
 * Part of the Campaign aggregate. A new design holds the image it was created
 * with; a restored one loads it on first use, as it can be large.
 */
export class PosterDesign {
  readonly id: PosterDesignId;
  readonly qrPlacement: QrPlacement;
  private readonly imageLoader: PosterDesignImageLoader;
  private loading?: Promise<PosterDesignImage>;

  private constructor(
    { id, qrPlacement, imageLoader }: PosterDesignProps,
    private loadedImage?: PosterDesignImage,
  ) {
    this.id = id;
    this.qrPlacement = qrPlacement;
    this.imageLoader = imageLoader;
  }

  /**
   * The design's image. A new design has it in memory; a restored one fetches
   * it on the first call and keeps it after that. Throws if a stored design's
   * image is missing.
   */
  image(): Promise<PosterDesignImage> {
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
        imageLoader: async () => image,
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
      const image = await this.imageLoader();
      if (!image) throw new Error("Poster design image is missing");
      this.loadedImage = image;
      return image;
    } finally {
      // A failed load can be retried.
      this.loading = undefined;
    }
  }
}
