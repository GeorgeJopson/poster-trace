import type { QrPlacementDto } from "./PosterDesignDto";

export type CampaignFieldsInput = {
  name: string;
  target: string;
};

export type CreatePosterDesignInput = {
  image: Blob;
  qrPlacement: QrPlacementDto;
};
