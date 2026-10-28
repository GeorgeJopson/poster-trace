import type { PosterDesignDto } from "./PosterDesignDto";

/** A campaign with its poster designs, oldest first. */
export type CampaignDto = {
  id: string;
  name: string;
  target: string;
  posterDesigns: PosterDesignDto[];
};
