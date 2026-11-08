/**
 * What a poster design is called on the campaign's pages: its position in
 * the campaign, counting from 1. `index` is its 0-based position.
 */
export function posterDesignLabel(index: number): string {
  return `Poster design ${index + 1}`;
}
