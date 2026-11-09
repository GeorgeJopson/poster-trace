import type { QrPlacementDto } from "./PosterDesignDto";

export type CampaignFieldsInput = {
  name: string;
  target: string;
};

export type CreatePosterDesignInput = {
  image: Blob;
  qrPlacement: QrPlacementDto;
};

/** Where a poster is, as the browser reported it. Accuracy is in metres. */
export type RegistrationLocationInput = {
  latitude: number;
  longitude: number;
  accuracy: number;
};
