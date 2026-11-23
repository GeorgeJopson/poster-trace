import "server-only";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { requireUserId } from "../auth/requireUserId";
import type { CampaignDto } from "../dto/CampaignDto";
import type { CampaignFieldsInput } from "../dto/inputs";
import { ScanTargetCopyError } from "../errors/ScanTargetCopyError";
import { CampaignDtoMapper } from "../mappers/CampaignDtoMapper";
import type { CampaignPosterLookup } from "../ports/CampaignPosterLookup";
import type { ScanTargetCopy } from "../ports/ScanTargetCopy";
import type { SessionProvider } from "../ports/SessionProvider";

/** The signed-in user's campaigns. */
export class CampaignService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
    private readonly campaignPosters: CampaignPosterLookup,
    private readonly scanTargets: ScanTargetCopy,
  ) {}

  async listMyCampaigns(): Promise<CampaignDto[]> {
    const userId = await requireUserId(this.sessions);
    const campaigns = await this.campaigns.findAllByOwner(userId);
    return campaigns.map(CampaignDtoMapper.toDto);
  }

  /** `null` if the campaign doesn't exist or isn't the user's. */
  async getMyCampaign(id: string): Promise<CampaignDto | null> {
    const userId = await requireUserId(this.sessions);
    const campaignId = CampaignId.parse(id);
    if (!campaignId) return null;
    const campaign = await this.campaigns.findByIdForOwner(campaignId, userId);
    return campaign && CampaignDtoMapper.toDto(campaign);
  }

  async createCampaign(input: CampaignFieldsInput): Promise<CampaignDto> {
    const userId = await requireUserId(this.sessions);
    const target = CampaignTarget.create(input.target);
    const campaign = Campaign.create(userId, input.name, target);
    await this.campaigns.save(campaign);
    return CampaignDtoMapper.toDto(campaign);
  }

  /**
   * Throws ScanTargetCopyError if the campaign was saved but its target
   * couldn't be copied for the scan redirect.
   */
  async updateCampaign(id: string, input: CampaignFieldsInput): Promise<void> {
    const userId = await requireUserId(this.sessions);
    const target = CampaignTarget.create(input.target);
    const campaignId = CampaignId.parse(id);
    const campaign =
      campaignId && (await this.campaigns.findByIdForOwner(campaignId, userId));
    if (!campaign) {
      throw new NotFoundError("Campaign not found");
    }
    campaign.setName(input.name);
    campaign.setTarget(target);
    await this.campaigns.save(campaign);
    // Even if the target is unchanged, so that saving again repairs a copy
    // an earlier failure left behind.
    await this.copyTarget(campaign.id, target);
  }

  /**
   * Copies a campaign's new target to its posters for the scan redirect,
   * which reads the copy first (ADR-0020). It runs after the save, so the
   * database is never behind the copy. A failure is thrown rather than
   * logged, so the owner saves again instead of scans carrying on to the old
   * target.
   */
  private async copyTarget(
    campaignId: CampaignId,
    target: CampaignTarget,
  ): Promise<void> {
    try {
      await this.scanTargets.copy(
        await this.campaignPosters.listPosterIds(campaignId),
        target,
      );
    } catch (error) {
      throw new ScanTargetCopyError({ cause: error });
    }
  }
}
