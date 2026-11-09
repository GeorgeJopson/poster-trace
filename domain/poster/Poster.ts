import type { PosterDesignId } from "../campaign/design/PosterDesignId";
import { ValidationError } from "../shared/ValidationError";
import { AlreadyRegisteredError } from "./AlreadyRegisteredError";
import { PosterId } from "./PosterId";
import type { Registration, RegistrationLocation } from "./Registration";
import type { Scan } from "./Scan";
import { ScanId } from "./ScanId";

export type PosterProps = {
  id: PosterId;
  designId: PosterDesignId;
  registration: Registration | null;
};

/**
 * One copy of a poster design with its own QR code, so scans can be traced
 * back to it. Its own aggregate, outside Campaign: it refers to its design by
 * id only (see ADR-0009).
 *
 * It holds only the scans added since it was generated or loaded, never its
 * stored ones, so recording a scan doesn't load them all (see ADR-0015). It
 * holds its registration, if it has one, as there's at most one (ADR-0016).
 */
export class Poster {
  readonly id: PosterId;
  readonly designId: PosterDesignId;
  private _registration: Registration | null;
  private readonly addedScans: Scan[] = [];

  private constructor({ id, designId, registration }: PosterProps) {
    this.id = id;
    this.designId = designId;
    this._registration = registration;
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
      () =>
        new Poster({ id: PosterId.generate(), designId, registration: null }),
    );
  }

  /** The poster's registration, or `null` if it hasn't been registered. */
  get registration(): Registration | null {
    return this._registration;
  }

  /**
   * Registers the poster, which can only happen once: the first registration
   * wins, so a registered poster throws `AlreadyRegisteredError` (ADR-0016).
   * The caller checks the poster name and location.
   */
  register(
    posterName: string,
    location: RegistrationLocation | null,
    registeredAt: Date,
  ): Registration {
    if (this._registration) throw new AlreadyRegisteredError();
    this._registration = { posterName, registeredAt, location };
    return this._registration;
  }

  /** Scans added since the poster was generated or loaded, oldest first. */
  get newScans(): readonly Scan[] {
    return this.addedScans;
  }

  /** Records a scan of the poster's QR code that happened at `scannedAt`. */
  addScan(scannedAt: Date): Scan {
    const scan: Scan = { id: ScanId.generate(), scannedAt };
    this.addedScans.push(scan);
    return scan;
  }

  /**
   * Rebuilds a stored poster, with its registration but without its stored
   * scans. Only repositories
   * call this.
   */
  static restore(props: PosterProps): Poster {
    return new Poster(props);
  }
}
