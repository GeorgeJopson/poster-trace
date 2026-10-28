import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    campaigns: r.many.campaign(),
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
  campaign: {
    user: r.one.user({
      from: r.campaign.userId,
      to: r.user.id,
      optional: false,
    }),
    posterDesigns: r.many.posterDesign(),
  },
  posterDesign: {
    campaign: r.one.campaign({
      from: r.posterDesign.campaignId,
      to: r.campaign.id,
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
