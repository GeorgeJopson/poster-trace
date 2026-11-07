"use server";

import { revalidatePath } from "next/cache";

import {
  getCampaignService,
  getPosterDesignService,
  getPosterService,
} from "@di/container";
import { routeNames } from "@/routeNames";
import type { PosterDto } from "@application/dto/PosterDto";
import { ValidationError } from "@domain/shared/ValidationError";
import { withSignInRedirect } from "@/utils/withSignInRedirect";

import { MAX_POSTERS_PER_REQUEST } from "./limits";

export async function updateCampaign(campaignId: string, formData: FormData) {
  return withSignInRedirect(async () => {
    const name = String(formData.get("name") ?? "");
    const target = String(formData.get("target") ?? "");

    await getCampaignService().updateCampaign(campaignId, { name, target });

    revalidatePath(routeNames.campaign(campaignId));
  });
}

export async function createPosterDesign(
  campaignId: string,
  formData: FormData,
) {
  return withSignInRedirect(async () => {
    const image = formData.get("image");
    if (!(image instanceof File)) {
      throw new Error("A poster design PDF is required");
    }

    // Validated by the service, which rejects NaN, so a missing or
    // non-numeric value fails there.
    await getPosterDesignService().createPosterDesign(campaignId, {
      image,
      qrPlacement: {
        x: parseFloat(String(formData.get("x"))),
        y: parseFloat(String(formData.get("y"))),
        size: parseFloat(String(formData.get("size"))),
        rotation: parseFloat(String(formData.get("rotation"))),
      },
    });

    revalidatePath(routeNames.campaign(campaignId));
  });
}

/**
 * The generated posters, or why they couldn't be generated. Returned rather
 * than thrown, because Next.js hides a thrown error's message in production.
 */
export type GeneratePostersResult =
  { posters: PosterDto[]; error?: never } | { error: string; posters?: never };

export async function generatePosters(
  campaignId: string,
  designId: string,
  formData: FormData,
): Promise<GeneratePostersResult> {
  return withSignInRedirect(async () => {
    // The domain rejects anything that isn't a whole number of at least 1.
    // The upper limit is only this form's, to keep each PDF a sensible size.
    const count = Number(formData.get("count"));
    if (count > MAX_POSTERS_PER_REQUEST) {
      return {
        error: `You can generate at most ${MAX_POSTERS_PER_REQUEST} posters at a time.`,
      };
    }
    try {
      return {
        posters: await getPosterService().generatePosters(
          campaignId,
          designId,
          count,
        ),
      };
    } catch (error) {
      // Its message is written for users. Anything else is rethrown, so a
      // redirect to log in still happens.
      if (error instanceof ValidationError) return { error: error.message };
      throw error;
    }
  });
}
