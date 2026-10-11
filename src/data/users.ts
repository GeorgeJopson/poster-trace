import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import db from "@/db";
import { posterCampaign, posterDesign } from "@/db/schema";
import { auth } from "@/auth/auth";
import { requireUserId } from "@/auth/session";
import { deleteImage } from "@/imageStorage";

export async function getCurrentUser() {
  const userId = await requireUserId();
  const user = await db.query.user.findFirst({
    where: { id: userId },
    columns: { name: true, email: true },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// Deletes the signed-in user. The database cascades the delete to their
// sessions, accounts, campaigns, designs, posters and scans; design images
// live in imageStorage, so they're deleted here.
export async function deleteCurrentUser() {
  const userId = await requireUserId();

  // Read the image keys first, since deleting the user deletes the designs
  // that point to them.
  const designs = await db
    .select({ designImageKey: posterDesign.designImageKey })
    .from(posterDesign)
    .innerJoin(
      posterCampaign,
      eq(posterDesign.posterCampaignId, posterCampaign.id),
    )
    .where(eq(posterCampaign.userId, userId));

  // Throws if the session isn't fresh. Images are only deleted after this
  // succeeds, so a rejected delete leaves the account intact.
  await auth.api.deleteUser({ body: {}, headers: await headers() });

  await Promise.all(
    designs.map(({ designImageKey }) => deleteImage(designImageKey)),
  );
}
