import { eq } from "drizzle-orm";

import type { ScanTargetLookup } from "@application/ports/ScanTargetLookup";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterId } from "@domain/poster/PosterId";

import type { Db } from "../db/client";
import {
  campaign as campaignTable,
  poster as posterTable,
  posterDesign as posterDesignTable,
} from "../db/schema";

export class DrizzleScanTargetLookup implements ScanTargetLookup {
  constructor(private readonly db: Db) {}

  async findTarget(posterId: PosterId): Promise<CampaignTarget | null> {
    // Every scan runs this, so it's one query joined on primary keys,
    // reading only the target.
    const [row] = await this.db
      .select({ target: campaignTable.target })
      .from(posterTable)
      .innerJoin(
        posterDesignTable,
        eq(posterDesignTable.id, posterTable.posterDesignId),
      )
      .innerJoin(
        campaignTable,
        eq(campaignTable.id, posterDesignTable.campaignId),
      )
      .where(eq(posterTable.id, posterId))
      .limit(1);
    // Through the validating factory like any stored value (ADR-0006), so
    // a scan is only ever sent to an http(s) URL.
    return row ? CampaignTarget.create(row.target) : null;
  }
}
