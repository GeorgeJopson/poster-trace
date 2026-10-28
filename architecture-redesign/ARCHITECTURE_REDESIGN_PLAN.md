# Architecture Redesign Plan
Poster Trace currently has little architecture. This redesign restructures it into the classic 4-layer Domain Driven Design architecture, written in object-oriented TypeScript.

This is a greenfield system, so breaking database schema changes are allowed, but the application's functionality must stay the same. Only today's features are in scope: posters, scans, poster registration and analytics are left out until they're built. There's no data to keep: the schema migration discards all existing poster data in every hosted database (see [infrastructure](infrastructure/README.md#migration)).

## Layers
| Layer | Folder | Responsibility | Sub-plan |
|---|---|---|---|
| Presentation | `src/` (`@/*`) | Next.js routes and components | [presentation](presentation/README.md) |
| Application | `application/` (`@application/*`) | Use cases; ports for the session and account | [application](application/README.md) |
| Domain | `domain/` (`@domain/*`) | Entities, value objects, business rules, repository interfaces | [domain](domain/README.md) |
| Infrastructure | `infrastructure/` (`@infrastructure/*`) | Drizzle, Netlify Blobs, Better Auth, Resend | [infrastructure](infrastructure/README.md) |
| Dependency injection | `di/` (`@di/*`) | Composition root wiring implementations to interfaces | [dependency injection](dependency-injection/README.md) |

Each new folder needs a path alias in `tsconfig.json`, alongside the existing `@/*` → `src/*`.

## Dependency rules
```
presentation ──► application ──► domain ◄── infrastructure
                      ▲                         │
                      └──── (implements ports) ─┘
di ──► everything (the only place that wires implementations to interfaces)
```
- **domain** imports nothing from the other layers, and no frameworks.
- **application** imports domain, and declares ports for what it needs from outside. It never imports infrastructure.
- **infrastructure** implements domain repositories and application ports.
- **presentation** calls application use cases obtained from di. It may import application DTO types, validation functions and errors, and domain constants and errors. Forms validate through [`@application/validation`](application/README.md#validation), not by calling domain factories themselves. It never imports infrastructure, except the documented [Better Auth exceptions](presentation/README.md#better-auth-exceptions).
- **di** is the only folder in the app that imports concrete infrastructure classes.
- **`scripts/` and `tests/`** sit outside the app and may import infrastructure directly: the seed reuses the schema and `NetlifyBlobStore`, and infrastructure tests construct the Drizzle repositories.

An ESLint `no-restricted-imports` rule per folder enforces these rules, with the exceptions allow-listed (see [presentation](presentation/README.md) for its allow-list). The rules apply to `src/`, `domain/`, `application/` and `infrastructure/` only; `di/`, `scripts/` and `tests/` have no import restrictions.

## Key decisions
| Topic | Decision |
|---|---|
| Aggregates | One repository per aggregate root: `UserRepository` and `CampaignRepository` (with its designs). |
| Naming | The core concept is a **Campaign** in every layer (`Campaign`, `CampaignRepository`, the `campaign` table). QR placement is `x`, `y`, `size` and `rotation` in every layer. |
| Campaign URLs | `/dashboard/campaign/{CampaignId}`, using the campaign's UUID. No slugs. |
| Design images | Stored under a blob key on the `poster_design` row, as today. The domain fetches an image by design id, and only sees blob keys as an opaque `PosterDesignImageRef` during account deletion. |
| Ownership | Owner-facing use cases check the session first (`requireUserId`), and owner-facing repository reads take an explicit `ownerId`. Other users' data looks missing (`NotFoundError` / `null`). |
| Signed-out users | Use cases throw `NotAuthenticatedError`; presentation turns it into a sign-in redirect with one helper, `withSignInRedirect`, used by every page, layout and Server Action. |
| Server → client data | Use cases return plain DTOs, never entities. |
| Authentication | A generic subdomain owned by Better Auth. Domain: users and ownership only. Application: `SessionProvider` and `AccountGateway` ports. Sign-in/up/out and password reset keep Better Auth's browser client and route. |
| Rate limiting | Per-IP limit stays in the Better Auth config. The per-account reset email cooldown is one function, `tryClaimResetEmailCooldown`, called from `sendResetPassword` in the Better Auth config. |
| Password/reset constants | `infrastructure/auth/passwordRules.ts`, imported by auth forms as an exception. |
| Stored rows | Loaded through the domain's validating factories. If a rule is tightened later, stored data must be checked or migrated at the same time (an accepted risk). |
| DI | Hand-written, lazy composition root with constructor injection; no DI library. Better Auth stays a module-level `auth`, as today (a documented exception). |
| Deploy rollback | The schema migration is destructive, so production can't be rolled back to a deploy from before it; fixes roll forward. |
| Orphaned images after a part-failed account deletion | Accepted for now; no clean-up job. |

## Testing
Test at the layer boundaries, in `tests/`, constructing the class under test directly with fakes for its constructor arguments. Each sub-plan has a Tests section.

The runner is **Vitest**, set up as in Next's `testing/vitest.md` guide, with an `npm test` script:
- `vite-tsconfig-paths` reuses the `tsconfig.json` paths, so `@domain/*`, `@application/*` etc. resolve as in the app.
- `server-only` is installed explicitly as a dependency (today only Next's compiled copy exists), and aliased to an empty module in `vitest.config.mts` (`resolve.alias`), so tests can import the services (every service file imports it). Outside Next, importing it otherwise fails.
- Domain, application and infrastructure tests run in the `node` environment.
- Presentation is covered by end-to-end tests instead.
