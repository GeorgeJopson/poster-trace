import { PosterDesignId } from "./PosterDesignId";
import type { PosterDesignImageUpload } from "./PosterDesignImageUpload";
import type { QrPlacement } from "./QrPlacement";

export type PosterDesignProps = {
  id: PosterDesignId;
  qrPlacement: QrPlacement;
};

/**
 * A design for a campaign's posters: an image with a QR code placed on it.
 * Part of the Campaign aggregate. The image is stored with the design and
 * fetched by the design's id.
 */
export class PosterDesign {
  readonly id: PosterDesignId;
  readonly qrPlacement: QrPlacement;
  /**
   * The image of a design made by `create`, for the repository to store.
   * A restored design never has one: its image is already stored.
   */
  readonly newImage?: PosterDesignImageUpload;

  private constructor(
    { id, qrPlacement }: PosterDesignProps,
    newImage?: PosterDesignImageUpload,
  ) {
    this.id = id;
    this.qrPlacement = qrPlacement;
    this.newImage = newImage;
  }

  /** A new design with a generated id. Only `Campaign.addDesign` calls this. */
  static create(
    qrPlacement: QrPlacement,
    image: PosterDesignImageUpload,
  ): PosterDesign {
    return new PosterDesign(
      { id: PosterDesignId.generate(), qrPlacement },
      image,
    );
  }

  /** Rebuilds a stored design. Only repositories call this. */
  static restore(props: PosterDesignProps): PosterDesign {
    return new PosterDesign(props);
  }
}
