import { routeNames } from "@/routeNames";

/** A poster design's image, fetched to draw posters from. */
export default async function fetchDesignImage(designId: string) {
  const response = await fetch(routeNames.posterDesignImage(designId));
  if (!response.ok) {
    throw new Error(`The design image failed to load (${response.status})`);
  }
  return {
    data: await response.arrayBuffer(),
    contentType: response.headers.get("Content-Type") ?? "",
  };
}
