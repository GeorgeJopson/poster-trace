import type { QrPlacementDto } from "./PosterDesignDto";

export type CampaignFieldsInput = {
  name: string;
  target: string;
};

export type CreatePosterDesignInput = {
  image: Blob;
  qrPlacement: QrPlacementDto;
};

/** Where the person registering a poster says it is. */
export type RegistrationLocationInput = {
  latitude: number;
  longitude: number;
};
