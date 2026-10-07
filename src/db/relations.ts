import { defineRelations } from "drizzle-orm";

import * as schema from "@/db/schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    posterCampaigns: r.many.posterCampaign(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  posterCampaign: {
    user: r.one.user({
      from: r.posterCampaign.userId,
      to: r.user.id,
      optional: false,
    }),
    posterDesigns: r.many.posterDesign(),
  },
  posterDesign: {
    posterCampaign: r.one.posterCampaign({
      from: r.posterDesign.posterCampaignId,
      to: r.posterCampaign.id,
      optional: false,
    }),
    posters: r.many.poster(),
  },
  poster: {
    posterDesign: r.one.posterDesign({
      from: r.poster.posterDesignId,
      to: r.posterDesign.id,
      optional: false,
    }),
    scans: r.many.scan(),
  },
  scan: {
    poster: r.one.poster({
      from: r.scan.posterId,
      to: r.poster.id,
      optional: false,
    }),
  },
}));
