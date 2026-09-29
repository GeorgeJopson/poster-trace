"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

import {
  getImageFileError,
  QR_RANGES,
} from "@/app/dashboard/campaign/[campaignId]/_components/CreatePosterDesignDialog/posterDesignValidation";

export async function updateCampaign(campaignId: number, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const target = String(formData.get("target") ?? "");

  await prisma.posterCampaign.update({
    where: { id: campaignId },
    data: { name, target },
  });

  revalidatePath(`/dashboard/campaign/${campaignId}`);
}

function parseQrValue(formData: FormData, name: keyof typeof QR_RANGES) {
  const { min, max } = QR_RANGES[name];
  const value = parseFloat(String(formData.get(name)));
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Invalid ${name}`);
  }
  return value;
}

export async function createPosterDesign(
  campaignId: number,
  formData: FormData,
) {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    throw new Error("A poster image is required");
  }
  const imageError = getImageFileError(image);
  if (imageError) {
    throw new Error(imageError);
  }

  await prisma.posterDesign.create({
    data: {
      design: new Uint8Array(await image.arrayBuffer()),
      designMimeType: image.type,
      qr_x_position: parseQrValue(formData, "qrXPosition"),
      qr_y_position: parseQrValue(formData, "qrYPosition"),
      qr_size: parseQrValue(formData, "qrSize"),
      qr_rotation: parseQrValue(formData, "qrRotation"),
      posterCampaignId: campaignId,
    },
  });

  revalidatePath(`/dashboard/campaign/${campaignId}`);
}
