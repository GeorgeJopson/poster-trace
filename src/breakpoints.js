/*
 * Media breakpoints — single source of truth for JavaScript.
 *
 * Mirrors the `@custom-media` rules in src/app/breakpoints.css, which JS
 * cannot read. Used for the `sizes` prop of `next/image`. Keep both files in
 * sync. See README.md for the breakpoint reference.
 */

/** Breakpoint widths in pixels, keyed by name. */
export const breakpoints = {
  smallPhoneAndDown: 400,
  phoneAndDown: 600,
  tabletAndDown: 950,
  laptopAndDown: 1300,
};

/** `px` as a rem `calc()` expression, keeping the conversion visible. */
const rem = (px) => `calc(${px} / 16 * 1rem)`;

/** Ready-to-use media conditions for `next/image` `sizes` strings. */
export const media = {
  smallPhoneAndDown: `(max-width: ${rem(breakpoints.smallPhoneAndDown)})`,
  phoneAndDown: `(max-width: ${rem(breakpoints.phoneAndDown)})`,
  tabletAndDown: `(max-width: ${rem(breakpoints.tabletAndDown)})`,
  laptopAndDown: `(max-width: ${rem(breakpoints.laptopAndDown)})`,
};
