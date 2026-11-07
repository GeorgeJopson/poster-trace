import type { PosterDesignId } from "../campaign/design/PosterDesignId";
import { ValidationError } from "../shared/ValidationError";
import { PosterId } from "./PosterId";

export type PosterProps = {
  id: PosterId;
  designId: PosterDesignId;
};

/**
 * One copy of a poster design with its own QR code, so scans can be traced
 * back to it. Its own aggregate, outside Campaign: it refers to its design by
 * id only (see ADR-0009).
 */
export class Poster {
  readonly id: PosterId;
  readonly designId: PosterDesignId;

  private constructor({ id, designId }: PosterProps) {
    this.id = id;
    this.designId = designId;
  }

  /**
   * `count` new posters of the design, each with a generated id. The caller
   * must have checked the design belongs to the user.
   */
  static generate(designId: PosterDesignId, count: number): Poster[] {
    if (!Number.isInteger(count) || count < 1) {
      throw new ValidationError(
        "The number of posters must be a whole number of at least 1.",
      );
    }
    return Array.from(
      { length: count },
      () => new Poster({ id: PosterId.generate(), designId }),
    );
  }

  /** Rebuilds a stored poster. Only repositories call this. */
  static restore(props: PosterProps): Poster {
    return new Poster(props);
  }
}
