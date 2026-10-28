import type { UserId } from "../user/UserId";
import { CampaignId } from "./CampaignId";
import type { CampaignTarget } from "./CampaignTarget";
import { PosterDesign } from "./design/PosterDesign";
import type { QrPlacement } from "./design/QrPlacement";

export type CampaignProps = {
  id: CampaignId;
  ownerId: UserId;
  name: string;
  target: CampaignTarget;
  designs: PosterDesign[];
};

/**
 * A poster campaign, owned by one user: the aggregate root for its poster
 * designs. Ownership is enforced by the repository's owner-scoped reads and
 * writes, not here.
 */
export class Campaign {
  readonly id: CampaignId;
  readonly ownerId: UserId;
  private name: string;
  private target: CampaignTarget;
  private readonly designs: PosterDesign[];

  private constructor(props: CampaignProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.target = props.target;
    this.designs = [...props.designs];
  }

  /** A new campaign with a generated id and no designs. */
  static create(
    ownerId: UserId,
    name: string,
    target: CampaignTarget,
  ): Campaign {
    return new Campaign({
      id: CampaignId.generate(),
      ownerId,
      name,
      target,
      designs: [],
    });
  }

  /** Rebuilds a stored campaign. Only repositories call this. */
  static restore(props: CampaignProps): Campaign {
    return new Campaign(props);
  }

  getName(): string {
    return this.name;
  }

  getTarget(): CampaignTarget {
    return this.target;
  }

  getDesigns(): readonly PosterDesign[] {
    return this.designs;
  }

  updateDetails(name: string, target: CampaignTarget): void {
    this.name = name;
    this.target = target;
  }

  /**
   * Adds a new design with a generated id, and returns it so the caller can
   * save it with its image.
   */
  addDesign(qrPlacement: QrPlacement): PosterDesign {
    const design = PosterDesign.create(qrPlacement);
    this.designs.push(design);
    return design;
  }
}
