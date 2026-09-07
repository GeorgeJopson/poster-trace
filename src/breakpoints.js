/*
 * Media breakpoints — single source of truth for JavaScript.
 *
 * Mirrors the `@custom-media` rules in src/app/breakpoints.css, which JS
 * cannot read. Used for the `sizes` prop of `next/image`. Keep both files in
 * sync. See README.md for the breakpoint reference.
 */

/** Max-width values, keyed by breakpoint name. */
export const breakpoints = {
  smallPhoneAndDown: "25rem", // 400 / 16
  phoneAndDown: "37.5rem", // 600 / 16
  tabletAndDown: "59.375rem", // 950 / 16
  laptopAndDown: "81.25rem", // 1300 / 16
};

/** Ready-to-use media conditions for `next/image` `sizes` strings. */
export const media = {
  smallPhoneAndDown: `(max-width: ${breakpoints.smallPhoneAndDown})`,
  phoneAndDown: `(max-width: ${breakpoints.phoneAndDown})`,
  tabletAndDown: `(max-width: ${breakpoints.tabletAndDown})`,
  laptopAndDown: `(max-width: ${breakpoints.laptopAndDown})`,
};
