import { eq } from "drizzle-orm";

import type { CampaignPosterLookup } from "@application/ports/CampaignPosterLookup";
import type { CampaignId } from "@domain/campaign/CampaignId";
import { PosterId } from "@domain/poster/PosterId";

import type { Db } from "../db/client";
import {
  poster as posterTable,
  posterDesign as posterDesignTable,
} from "../db/schema";

export class DrizzleCampaignPosterLookup implements CampaignPosterLookup {
  constructor(private readonly db: Db) {}

  async listPosterIds(campaignId: CampaignId): Promise<PosterId[]> {
    // The inner join to the design picks the campaign's posters.
    const rows = await this.db
      .select({ id: posterTable.id })
      .from(posterTable)
      .innerJoin(
        posterDesignTable,
        eq(posterDesignTable.id, posterTable.posterDesignId),
      )
      .where(eq(posterDesignTable.campaignId, campaignId));
    return rows.map((row) => PosterId.from(row.id));
  }
}
