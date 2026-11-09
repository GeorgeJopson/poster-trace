const ADJECTIVES = [
  "Gentle",
  "Moon-misted",
  "Opal",
  "Amber",
  "Whispering",
  "Sunlit",
  "Hidden",
  "Silver",
  "Mossy",
  "Windswept",
  "Crimson",
  "Quiet",
  "Golden",
  "Frosted",
  "Wandering",
  "Velvet",
  "Starlit",
  "Misty",
  "Copper",
  "Emerald",
];

const PLACES = [
  "Swamp",
  "Hills",
  "Tower",
  "Harbour",
  "Meadow",
  "Grove",
  "Valley",
  "Lighthouse",
  "Orchard",
  "Canyon",
  "Bridge",
  "Lagoon",
  "Glade",
  "Summit",
  "Marsh",
  "Cove",
  "Heath",
  "Hollow",
  "Fjord",
  "Garden",
];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

// A memorable default poster name, an adjective then a place, such as
// "Gentle Swamp". `random` returns a number in [0, 1), like Math.random.
export function randomPosterName(random: () => number = Math.random): string {
  return `${pick(ADJECTIVES, random)} ${pick(PLACES, random)}`;
}

// The poster name a registration saves: what was entered, trimmed, or the
// default name (shown as the field's placeholder) when nothing was entered.
export function resolvePosterName(
  entered: string,
  defaultName: string,
): string {
  return entered.trim() || defaultName;
}
