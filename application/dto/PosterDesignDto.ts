export type QrPlacementDto = {
  x: number;
  y: number;
  size: number;
  rotation: number;
};

/** A poster design. Its image is served by the design's id. */
export type PosterDesignDto = {
  id: string;
  qrPlacement: QrPlacementDto;
};
