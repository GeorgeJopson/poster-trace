export const BREAKPOINTS = {
  phoneMax: 600,
  tabletMax: 950,
  laptopMax: 1300,
}

export const QUERIES = {
  'phoneAndDown': `(max-width: ${BREAKPOINTS.phoneMax / 16}rem)`,
  'tabletAndDown': `(max-width: ${BREAKPOINTS.tabletMax / 16}rem)`,
  'laptopAndDown': `(max-width: ${BREAKPOINTS.laptopMax / 16}rem)`,
}

export const ELEVATIONS = {
  small: `
    0.5px 1px 1px hsl(var(--shadow-color) / 0.7)
  `,
  medium: `
    1px 2px 2px hsl(var(--shadow-color) / 0.333),
    2px 4px 4px hsl(var(--shadow-color) / 0.333),
    3px 6px 6px hsl(var(--shadow-color) / 0.333)
  `,
  large: `
    1px 2px 2px hsl(var(--shadow-color) / 0.2),
    2px 4px 4px hsl(var(--shadow-color) / 0.2),
    4px 8px 8px hsl(var(--shadow-color) / 0.2),
    8px 16px 16px hsl(var(--shadow-color) / 0.2),
    16px 32px 32px hsl(var(--shadow-color) / 0.2)
  `
}
