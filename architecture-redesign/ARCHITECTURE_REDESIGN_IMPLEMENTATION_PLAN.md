# Architecture Redesign Implementation Plan
How to carry out the [architecture redesign](ARCHITECTURE_REDESIGN_PLAN.md). The sub-plans say *what* each layer looks like; this says *in what order* it's built, and how we know it still works.

## Strategy
**One branch, one merge.** The whole redesign is built on a single branch, `architecture-redesign-implementation` (off `main`), and merged into `main` once, when it's complete and verified.

Why not separate stages, each merged into `main`:
- **The project is small.** The code being replaced (`src/data`, `src/db`, `src/auth`, `src/email`, `src/imageStorage`) is about 900 lines, behind a handful of entry points.
- **There's no data to keep.** The schema migration discards all poster data anyway, and can't be rolled back (see [infrastructure](infrastructure/README.md#migration)). Staged merges mostly protect a running system's data and rollback path, and this migration removes both.
- **Staging has real costs here.** Layer-by-layer stages merge code nothing calls until the last stage, so every risk lands at the end anyway. Feature slices or a strangler need temporary adapters and old/new code side by side, which would be written only to be deleted.

What we keep from staging, so the single merge is safe:
1. **End-to-end tests first** ([commit 1](#1-end-to-end-tests)). They pin today's behaviour before any code changes, and are the bar the branch must pass before merging.
2. **Commits ordered by layer.** The branch reads like a staged plan, so it can be reviewed commit by commit even though it merges once. Not every intermediate commit has to build; the [checks](#checks) say which must.
3. **The migration is rehearsed on a deploy preview** before merging (see [Merge](#merge)). After the merge, fixes roll forward.

## Branch and commits
| # | Commit | Must build and pass e2e? |
|---|---|---|
| 1 | [End-to-end tests](#1-end-to-end-tests) | ✓ (against today's code) |
| 2 | [Tooling](#2-tooling) | ✓ |
| 3 | [Move infrastructure files](#3-move-infrastructure-files) | ✓ |
| 4 | [Domain layer](#4-domain-layer) | ✓ (unused code) |
| 5 | [Application layer](#5-application-layer) | ✓ (unused code) |
| 6 | [Infrastructure layer](#6-infrastructure-layer) | Unit tests only; the app may not build (old code vs. new schema) |
| 7 | [Dependency injection](#7-dependency-injection) | Unit tests only |
| 8 | [Presentation switchover](#8-presentation-switchover) | ✓ (e2e updated for UUID URLs and renamed fields) |
| 9 | [Lint rules and clean-up](#9-lint-rules-and-clean-up) | ✓, and `npm run lint` with the layer rules as errors |

Commits 6 to 8 are the window where the app may be broken. Keep it short: if it helps review, commits 6 and 7 may be squashed into 8 before merging, but keeping them apart is preferred.

Each commit is described below with the files it touches and what it's done against. The sub-plans are the spec; anything here that contradicts them is a mistake in this file.

### 1. End-to-end tests
Pins today's behaviour, against today's code, before anything changes.

- Install **Playwright** as set up in Next's `testing/playwright.md` guide (`node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`). Add `playwright.config.ts` and an `npm run test:e2e` script.
- Tests live in `tests/e2e/`. They run against the local app (`netlify dev`, so the database and Blobs work) with a freshly reset and seeded local database (`npm run db:reset && npm run seed`).
- Tests use a user signed up within the test (email and password), so they don't depend on seed data.
- Scenarios, from the presentation plan's [Tests](presentation/README.md#tests) and today's features:
  - Sign up, sign out, log in. Signed-in users visiting log-in or sign-up are redirected (`useRedirectIfSignedIn`).
  - Signed-out users visiting any `(app)` page are redirected to log in.
  - Create a campaign → redirected to its page; it appears on the dashboard, in creation order with other campaigns.
  - Edit a campaign's name and target; invalid input shows the validation message.
  - Add a poster design (upload, QR placement); it appears in the designs list, and its image loads from the image route.
  - Another user's campaign page and design image are 404s.
  - The analytics page and its `@pageNav` render for an owned campaign.
  - The session expires mid-use (delete the session cookie): navigating, and submitting a form, both redirect to log in.
  - Request a password reset: the form shows its confirmation. (The email itself isn't checked.)
  - Delete the account: signed out, and logging in again fails.
- Not covered: Google sign-in (needs a real Google account) and the content of the reset email.
- Write the tests to find elements by role and label, not CSS classes, so commit 8 only has to change URLs and field names.

### 2. Tooling
No app code changes.

- **Vitest**, as in the main plan's [Testing](ARCHITECTURE_REDESIGN_PLAN.md#testing) and Next's `testing/vitest.md` guide: install `vitest` and `vite-tsconfig-paths`, add `vitest.config.mts` (`node` environment; `resolve.alias` maps `server-only` to an empty module; excludes `tests/e2e/`), and an `npm test` script.
- Install `server-only` as an explicit dependency.
- **`tsconfig.json` paths:** add `@domain/*` → `./domain/*`, `@application/*` → `./application/*`, `@infrastructure/*` → `./infrastructure/*`, `@di/*` → `./di/*`, next to `@/*`.
- **ESLint:** add the `no-restricted-imports` rules per folder from the main plan's [Dependency rules](ARCHITECTURE_REDESIGN_PLAN.md#dependency-rules), with the [presentation allow-list](presentation/README.md) and [Better Auth exceptions](presentation/README.md#better-auth-exceptions). Set them to **`"off"`** for now; they're written here so the rules are reviewed early, and turned on in [commit 9](#9-lint-rules-and-clean-up).

### 3. Move infrastructure files
Pure moves with import updates, no behaviour changes, so later diffs show only real changes. Use `git mv` so history follows.

| From | To |
|---|---|
| `src/db/index.ts` | `infrastructure/db/client.ts` |
| `src/db/schema.ts`, `src/db/relations.ts` | `infrastructure/db/` |
| `src/imageStorage/index.ts`, `localDev.ts` | `infrastructure/storage/` (contents unchanged until commit 6) |
| `src/auth/auth.ts` | `infrastructure/auth/betterAuth.ts` |
| `src/auth/auth-client.ts` | `infrastructure/auth/authClient.ts` |
| `src/auth/passwordRules.ts` | `infrastructure/auth/passwordRules.ts` |
| `src/email/index.ts` | `infrastructure/email/index.ts` |
| `src/email/config.ts` | `infrastructure/email/emailConfig.ts` |
| `src/email/templates/` | `infrastructure/email/templates/` |

- `src/auth/session.ts` stays for now; it's replaced in commit 8.
- Update every `@/db`, `@/auth`, `@/email` and `@/imageStorage` import (in `src/` and `scripts/seed.ts`) to the `@infrastructure/*` path.
- `drizzle.config.ts`: `schema: "./infrastructure/db/schema.ts"`.
- `package.json` `email:dev`: `email dev --dir infrastructure/email/templates`.
- Check: `npm run db:generate` reports no changes (the schema didn't change, only moved).

### 4. Domain layer
Everything in the [domain plan](domain/README.md). Nothing imports it yet.

- `domain/shared/`: `ValidationError`, `NotFoundError`, `uuid.ts`.
- `domain/user/`: `User`, `UserId`, `UserRepository`.
- `domain/campaign/`: `Campaign`, `CampaignId`, `CampaignTarget`, `CampaignRepository`.
- `domain/campaign/design/`: `PosterDesign`, `PosterDesignId`, `QrPlacement`, `PosterDesignImageRules`, `PosterDesignImageUpload`, `PosterDesignImageContent`, `PosterDesignImageRef`.
- Move today's rules from `src/data/campaignValidation.ts` and `src/data/posterDesignValidation.ts` into the value objects. The old files stay until commit 8; don't change them.
- Tests in `tests/domain/`, per the domain plan's [Tests](domain/README.md#tests): value object rules (port today's validation cases), id parsing and generation, entity behaviour.
- Check: no file in `domain/` imports a framework or `server-only`.

### 5. Application layer
Everything in the [application plan](application/README.md). Nothing imports it yet.

- `ports/`: `SessionProvider`, `AccountGateway`.
- `errors/`: `NotAuthenticatedError`, `AccountDeletionRefusedError`.
- `auth/requireUserId.ts`.
- `dto/`: `CampaignDto`, `PosterDesignDto`, `CurrentUserDto`, `PosterDesignImageDto`, `inputs.ts`.
- `mappers/CampaignDtoMapper.ts`.
- `validation/`: `getValidationMessage`, `validateCampaignTarget`, `validatePosterImage`.
- `services/`: `CampaignService`, `PosterDesignService`, `AccountService`. Every service file imports `server-only`; `dto/` and `validation/` never do.
- Tests in `tests/application/`, per the application plan's [Tests](application/README.md#tests): in-memory fakes in `tests/application/fakes/` (`InMemoryCampaignRepository`, `InMemoryUserRepository`, `FakeSessionProvider`, `FakeAccountGateway`), with the repository fake matching the Drizzle repository's `updateDetails` and `addDesign` behaviour. Plain unit tests for `validation/`.

Building the application before the infrastructure is deliberate: the auth adapters in commit 6 implement the ports declared here.

### 6. Infrastructure layer
Everything in the [infrastructure plan](infrastructure/README.md). This commit changes the schema, so today's `src/data` code no longer matches it; the app may not build again until commit 8.

- **Schema** (`infrastructure/db/schema.ts`, `relations.ts`): the [schema changes](infrastructure/README.md#schema-changes): `uuid` ids with no default, `campaign` table, `x`/`y`/`size`/`rotation`, `created_at`, renamed exports and relations, row types deleted.
- **Migration:** `npm run db:generate`, then **hand-edit** it per [Migration](infrastructure/README.md#migration): drop `scan`, `poster`, `poster_design`, `poster_campaign` in that order, then create `campaign`, `poster_design`, `poster`, `scan`. Answer "new table" to the rename prompt. Better Auth's tables and `password_reset_email` must not appear in it.
- **`db/client.ts`:** exported `getDb()` returns the lazy Proxy; the eager internal function is renamed and private.
- **Repositories:** `DrizzleUserRepository`, `DrizzleCampaignRepository`, `CampaignRowMapper`.
- **Storage:** `BlobStore` interface and `NetlifyBlobStore` (store name constant, `deletesAllowedIn`, store lookup per call, explicit `contentType`) replacing today's `imageStorage` module; `localDev.ts` exports `connectToLocalBlobStorage`.
- **Auth:** `BetterAuthSessionProvider` (reads `headers()`, React `cache()`), `BetterAuthAccountGateway`; `authClient.ts` re-exports the `BetterFetchOption` type.
- **Email:** `resetEmailCooldown.ts` (`tryClaimResetEmailCooldown`, moved out of `betterAuth.ts` unchanged), called from `sendResetPassword`.
- **Seed:** `scripts/seed.ts` per the DI plan's [seed section](dependency-injection/README.md#scriptsseedts), in this commit because it imports the schema: own local connection, `NetlifyBlobStore` with the shared constants, domain-generated ids and value objects, QR values in the app's units.
- Tests in `tests/infrastructure/`, per the infrastructure plan's [Tests](infrastructure/README.md#tests). The database tests run against a local test Postgres; add a separate `npm run test:db` script if they need it, so `npm test` still runs without a database.
- Check: `npm run db:reset && npm run seed` applies every migration cleanly, from the baseline up, and seeds.

### 7. Dependency injection
- `di/container.ts` per the [DI plan](dependency-injection/README.md): lazy, memoised getters; `server-only`; only the three services exported.
- No tests (see the DI plan's [Tests](dependency-injection/README.md#tests)); it's covered by e2e from commit 8.

### 8. Presentation switchover
The app runs on the new layers. Everything in the [presentation plan](presentation/README.md):

- Add `src/utils/withSignInRedirect.ts` and `src/app/(app)/dashboard/campaign/[campaignId]/getCampaign.ts`.
- Every entry point in [Changes per file](presentation/README.md#changes-per-file) gets its service from di, through `withSignInRedirect`. The image route maps `NotAuthenticatedError` to 404.
- `routeNames.ts`: string (UUID) ids; add `posterDesignImage`.
- Components switch to DTOs, `@application/validation`, and the `x`/`y`/`size`/`rotation` field names with `QrPlacement.RANGES`. `CampaignContext` uses `id: string`.
- `drawPoster.ts`: `DrawableQrPlacement`; `DEFAULT_TARGET` moves here.
- `SocialSignOn` imports `BetterFetchOption` from `@infrastructure/auth/authClient`.
- **Delete** `src/data/` and `src/auth/session.ts` (and any empty `src/db/`, `src/auth/`, `src/email/`, `src/imageStorage/` folders left).
- Update the e2e tests for UUID URLs and renamed fields only. Any other change to a test means behaviour changed, which must be justified in the commit message.

### 9. Lint rules and clean-up
- Turn the ESLint layer rules from `"off"` to `"error"`; fix anything they flag.
- Update `README.md` with the new folder layout and the `test`, `test:e2e` (and `test:db`) scripts.

## Checks
Before each commit marked ✓ in [Branch and commits](#branch-and-commits):
```
npm run typecheck && npm run lint && npm test && npm run build
npm run db:reset && npm run seed && npm run test:e2e
```
Commits 6 and 7 need only `npm test` (and, for commit 6, `test:db` and a clean `db:reset` + `seed`).

## Merge
1. **Full checks** on the final commit, as above, plus a manual pass of what e2e doesn't cover: Google sign-in, and a password reset email end to end.
2. **Rehearse the migration on a deploy preview.** Open the PR into `main`. The deploy preview's database branch applies the migration, which proves the hand-edited SQL runs against a hosted database built from the old schema. Run through the e2e scenarios by hand on the preview. Note that the preview shares the production Blobs store, but `NetlifyBlobStore` doesn't delete there, so it can't damage production images.
3. **Review commit by commit** in the order above.
4. **Merge.** Netlify applies the migration on the production deploy: every user keeps their account, and all campaigns and designs are gone (expected and accepted; see the [main plan](ARCHITECTURE_REDESIGN_PLAN.md)).
5. **After deploy:** smoke-test production (sign in, create a campaign, add a design, view its image). Anything broken is fixed forward; "publish previous deploy" doesn't work past this migration.

## Done when
- Every feature works as before (e2e passes; manual checks done), on the new layers.
- `src/` has no `data/`, `db/`, `auth/`, `email/` or `imageStorage/` folder.
- The ESLint layer rules are errors and pass.
- Unit tests cover domain, application and infrastructure as each sub-plan's Tests section describes.
