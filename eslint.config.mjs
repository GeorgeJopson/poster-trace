import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

// Layer dependency rules (see architecture-redesign/ARCHITECTURE_REDESIGN_PLAN.md):
//
//   presentation (src/) ──► application ──► domain ◄── infrastructure
//            │                                            ▲
//            └──────────► clientApplication ──────────────┘
//
// clientApplication is the browser's application layer. It only imports the
// browser-safe infrastructure in CLIENT_INFRASTRUCTURE.
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

/** Infrastructure that `allowed` doesn't list, with `message`. */
function infrastructureExcept(allowed, message) {
  return allowed.length === 0
    ? { group: ["@infrastructure/**"], message }
    : { regex: `^@infrastructure/(?!(${allowed.join("|")})$)`, message };
}

/**
 * The presentation rules, allowing the infrastructure modules in
 * `allowedInfrastructure` and the Better Auth modules in `allowedBetterAuth`.
 */
function presentationPatterns(
  allowedInfrastructure = [],
  allowedBetterAuth = [],
) {
  return [
    infrastructureExcept(
      allowedInfrastructure,
      "Presentation goes through @clientApplication (in the browser) or @di/container (on the server).",
    ),
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

// The infrastructure that's safe to bundle for the browser.
const CLIENT_INFRASTRUCTURE = ["auth/authClient", "auth/passwordRules"];

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
    // Bundled for the browser by the Client Components that use it.
    files: ["clientApplication/**"],
    rules: layerRule([
      presentation,
      di,
      infrastructureExcept(
        CLIENT_INFRASTRUCTURE,
        "clientApplication only imports browser-safe infrastructure.",
      ),
      {
        group: ["@application/services/**", "@application/ports/**"],
        message: "Application services run on the server.",
      },
      { ...frameworks, group: [...frameworks.group, "server-only"] },
    ]),
  },
  {
    files: ["src/**"],
    rules: layerRule(presentationPatterns()),
  },
  {
    // Better Auth's route handler serves the module-level `auth` (see
    // architecture-redesign/presentation/README.md).
    files: ["src/app/api/auth/**"],
    rules: layerRule(presentationPatterns(["auth/betterAuth"], ["next-js"])),
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
