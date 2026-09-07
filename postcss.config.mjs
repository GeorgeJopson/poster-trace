/**
 * Resolves `@custom-media` queries at build time so media breakpoints have a
 * single source of truth (src/app/breakpoints.css). `postcss-global-data`
 * makes those definitions visible to every CSS file; `postcss-custom-media`
 * rewrites `@media (--name)` to a plain `@media (max-width: ...)` query.
 *
 * Turbopack picks this file up automatically and runs it before Lightning CSS.
 */
const config = {
  plugins: [
    ["@csstools/postcss-global-data", { files: ["./src/app/breakpoints.css"] }],
    ["postcss-custom-media", {}],
  ],
};

export default config;
