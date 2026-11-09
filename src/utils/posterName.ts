import { POSTER_NAME_ADJECTIVES, POSTER_NAME_PLACES } from "./posterNameWords";

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

// A memorable default poster name, an adjective then a place, such as
// "Gentle Swamp". `random` returns a number in [0, 1), like Math.random.
export function randomPosterName(random: () => number = Math.random): string {
  return `${pick(POSTER_NAME_ADJECTIVES, random)} ${pick(POSTER_NAME_PLACES, random)}`;
}

// The poster name a registration saves: what was entered, trimmed, or the
// default name (shown as the field's placeholder) when nothing was entered.
export function resolvePosterName(
  entered: string,
  defaultName: string,
): string {
  return entered.trim() || defaultName;
}
