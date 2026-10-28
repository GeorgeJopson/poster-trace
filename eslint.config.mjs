import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

// Layer dependency rules (see architecture-redesign/ARCHITECTURE_REDESIGN_PLAN.md):
//
//   presentation (src/) ──► application ──► domain ◄── infrastructure
//
// di/, scripts/ and tests/ have no import restrictions.

const frameworks = {
  group: [
    "next",
    "next/**",
    "react",
    "react/**",
    "react-dom",
    "react-dom/**",
    "better-auth",
    "better-auth/**",
    "drizzle-orm",
    "drizzle-orm/**",
    "@netlify/**",
    "pg",
    "resend",
  ],
  message: "This layer can't depend on frameworks.",
};

const presentation = { group: ["@/**"], message: "Only src/ imports src/." };
const di = {
  group: ["@di/**"],
  message: "Only presentation gets services from di.",
};
const infrastructure = {
  group: ["@infrastructure/**"],
  message: "Only di wires in infrastructure.",
};

/**
 * The presentation rules, allowing the infrastructure modules in
 * `allowedInfrastructure` and the Better Auth modules in `allowedBetterAuth`.
 */
function presentationPatterns(allowedInfrastructure, allowedBetterAuth = []) {
  return [
    {
      regex: `^@infrastructure/(?!(${allowedInfrastructure.join("|")})$)`,
      message:
        "Presentation only imports infrastructure for the Better Auth exceptions.",
    },
    {
      group: [
        "@application/services/**",
        "@application/ports/**",
        "@application/mappers/**",
        "@application/auth/**",
      ],
      message: "Get services from @di/container instead.",
    },
    {
      group: ["@application/dto/**"],
      allowTypeImports: true,
      message: "DTOs are types: use `import type`.",
    },
    {
      regex: `^better-auth(?!/(${allowedBetterAuth.join("|")})$)`,
      message: "Presentation goes through the application layer.",
    },
    {
      group: ["drizzle-orm", "drizzle-orm/**", "@netlify/**", "server-only"],
      message: "Presentation goes through the application layer.",
    },
  ];
}

// Better Auth exceptions (see architecture-redesign/presentation/README.md).
const BETTER_AUTH_CLIENT = ["auth/authClient", "auth/passwordRules"];

function layerRule(patterns) {
  return {
    "@typescript-eslint/no-restricted-imports": ["error", { patterns }],
  };
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["domain/**"],
    rules: layerRule([
      presentation,
      di,
      infrastructure,
      { group: ["@application/**"], message: "Domain imports no other layer." },
      { ...frameworks, group: [...frameworks.group, "server-only"] },
    ]),
  },
  {
    files: ["application/**"],
    rules: layerRule([presentation, di, infrastructure, frameworks]),
  },
  {
    // Bundled for the browser by the forms.
    files: ["application/dto/**", "application/validation/**"],
    rules: layerRule([
      presentation,
      di,
      infrastructure,
      { ...frameworks, group: [...frameworks.group, "server-only"] },
    ]),
  },
  {
    files: ["infrastructure/**"],
    rules: layerRule([presentation, di]),
  },
  {
    files: ["src/**"],
    rules: layerRule(presentationPatterns(BETTER_AUTH_CLIENT)),
  },
  {
    // Better Auth's route handler serves the module-level `auth`.
    files: ["src/app/api/auth/**"],
    rules: layerRule(
      presentationPatterns(
        [...BETTER_AUTH_CLIENT, "auth/betterAuth"],
        ["next-js"],
      ),
    ),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright output.
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
