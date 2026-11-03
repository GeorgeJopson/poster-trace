import "server-only";

import { Campaign } from "@domain/campaign/Campaign";
import { CampaignId } from "@domain/campaign/CampaignId";
import type { CampaignRepository } from "@domain/campaign/CampaignRepository";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import { NotFoundError } from "@domain/shared/NotFoundError";

import { requireUserId } from "../auth/requireUserId";
import type { CampaignDto } from "../dto/CampaignDto";
import type { CampaignFieldsInput } from "../dto/inputs";
import { CampaignDtoMapper } from "../mappers/CampaignDtoMapper";
import type { SessionProvider } from "../ports/SessionProvider";

/** The signed-in user's campaigns. */
export class CampaignService {
  constructor(
    private readonly sessions: SessionProvider,
    private readonly campaigns: CampaignRepository,
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
    await this.campaigns.add(campaign);
    return CampaignDtoMapper.toDto(campaign);
  }

  async updateCampaign(id: string, input: CampaignFieldsInput): Promise<void> {
    const userId = await requireUserId(this.sessions);
    const target = CampaignTarget.create(input.target);
    const campaignId = CampaignId.parse(id);
    const campaign =
      campaignId && (await this.campaigns.findByIdForOwner(campaignId, userId));
    if (!campaign) {
      throw new NotFoundError("Campaign not found");
    }
    campaign.updateDetails(input.name, target);
    await this.campaigns.updateDetails(campaign);
  }
}
