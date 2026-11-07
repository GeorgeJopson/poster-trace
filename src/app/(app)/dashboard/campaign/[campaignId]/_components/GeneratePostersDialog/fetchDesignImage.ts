import { PosterDesignImageRules } from "@domain/campaign/design/PosterDesignImageRules";
import { routeNames } from "@/routeNames";

/** A poster design's image, fetched to draw posters from. */
export default async function fetchDesignImage(designId: string) {
  const response = await fetch(routeNames.posterDesignImage(designId));
  if (!response.ok) {
    throw new Error(`The design image failed to load (${response.status})`);
  }
  const contentType = response.headers.get("Content-Type");
  if (!PosterDesignImageRules.isAllowedType(contentType)) {
    throw new Error(`Can't make posters from a ${contentType} design`);
  }
  return { data: await response.arrayBuffer(), contentType };
}
