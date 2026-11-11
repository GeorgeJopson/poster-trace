import { Campaign } from "@domain/campaign/Campaign";
import { CampaignTarget } from "@domain/campaign/CampaignTarget";
import type { PosterDesignId } from "@domain/campaign/design/PosterDesignId";
import { PosterDesignImage } from "@domain/campaign/design/PosterDesignImage";
import { QrPlacement } from "@domain/campaign/design/QrPlacement";
import type { UserId } from "@domain/user/UserId";
import { getDb } from "@infrastructure/db/client";
import { user } from "@infrastructure/db/schema";
import { DrizzleCampaignRepository } from "@infrastructure/repositories/DrizzleCampaignRepository";

import { A4_PDF_DETAILS } from "../../support/pdfs";
import { FakeBlobStore } from "./FakeBlobStore";

export const db = getDb();

/** Deletes every user, which cascades to all of their data. */
export async function clearDatabase() {
  await db.delete(user);
}

export async function insertUser(id: string) {
  await db.insert(user).values({
    id,
    name: `User ${id}`,
    email: `${id}@example.com`,
  });
}

/** Stores a campaign of the owner's with one design, returning its id. */
export async function insertDesign(owner: UserId): Promise<PosterDesignId> {
  const campaign = Campaign.create(
    owner,
    "Campaign",
    CampaignTarget.create("https://example.com/"),
  );
  const design = campaign.addDesign(
    QrPlacement.create({ x: 10, y: 10, size: 20, rotation: 0 }),
    PosterDesignImage.create(new Blob(["pdf"]), A4_PDF_DETAILS),
  );
  await new DrizzleCampaignRepository(db, new FakeBlobStore()).save(campaign);
  return design.id;
}
