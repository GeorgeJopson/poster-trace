/**
 * What a design is called on the analytics page: its position in the
 * campaign, as on the campaign page.
 */
export function designLabel(designIds: readonly string[], designId: string) {
  return `Poster design ${designIds.indexOf(designId) + 1}`;
}
