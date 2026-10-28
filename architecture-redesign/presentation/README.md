# Presentation Layer

The Next.js UI. Lives in `src/` (alias `@/*`): `src/app` for routes and `src/components` for shared components. `public/` stays at the project root, as Next.js only serves static files from there.

**Rules**
- Calls application use cases obtained from [di](../dependency-injection/README.md) (`getCampaignService()` etc.). Never constructs services itself.
- **Every call to a service from a page, layout, `@pageNav` slot or Server Action goes through `withSignInRedirect`** (see [Error handling](#error-handling)). The image route is the one exception: it maps a missing session to 404.
- Forms validate with [`@application/validation`](../application/README.md#validation) (`validateCampaignTarget`, `validatePosterImage`), not by calling domain factories themselves. They may import domain constants for input attributes and drawing (`CampaignTarget.MAX_LENGTH`, `QrPlacement.RANGES`). This is a convention, not enforced by lint: `@domain/**` is allowed so that error classes can be imported too.
- May import **application** DTO types with `import type`, and application and domain errors for [error handling](#error-handling).
- Never imports infrastructure, except the [Better Auth exceptions](#better-auth-exceptions).
- Client Components never call application services. They get plain DTOs through props, or call Server Actions for anything that needs the session or database.
- Enforced by an ESLint `no-restricted-imports` rule on `src/`. Allowed:
  - `@application/dto/*` (type-only), `@application/validation/*` and `@application/errors/*` (`NotAuthenticatedError` for `withSignInRedirect` and the image route, `AccountDeletionRefusedError`);
  - `@domain/**` (constants and errors such as `NotFoundError`);
  - `@di/*`, from which pages, actions and routes get services;
  - the [Better Auth exceptions](#better-auth-exceptions).

  `@application/services/*`, `@application/ports/*` and `@application/mappers/*` are blocked everywhere in `src/`, as pages and actions get services from di. A Client Component that imports a service or di anyway fails the build, because both import `server-only`.

## Server entry points
| Entry point | Runs on | Calls |
|---|---|---|
| Server Components (`page.tsx`, `layout.tsx`, `@pageNav` slots) | Server, on render | Application **queries**, through `withSignInRedirect` |
| Server Actions (`actions.ts`, `"use server"`) | Server, on form submit | Application **commands**, through `withSignInRedirect` |
| `app/api/poster-designs/[designId]/image/route.ts` | Server, on HTTP request | `PosterDesignService.getMyPosterDesignImage` |
| `app/api/auth/[...all]/route.ts` | Server, on HTTP request | Better Auth handler (the module-level `auth`) |
| Client Components using `authClient` | Browser → `/api/auth/*` | Better Auth |

## Changes per file
**Entry points.** Each one listed here wraps its service calls in `withSignInRedirect`, so a signed-out user is redirected to log in wherever the session runs out:

| File | Change |
|---|---|
| `(app)/layout.tsx` | `withSignInRedirect(() => getAccountService().requireCurrentUserId())` |
| `(app)/dashboard/page.tsx` | `withSignInRedirect(() => getCampaignService().listMyCampaigns())` |
| `[campaignId]/page.tsx`, `analytics/page.tsx` | `getCampaign(campaignId)` (cached and wrapped, see [below](#per-request-caching)), passed the raw segment; `notFound()` on `null`. Today's `Number(campaignId)` goes. |
| `@pageNav/.../[campaignId]/layout.tsx` | `getCampaign(campaignId)`; returns `null` on `null`, as today, leaving the 404 to the page. |
| `(app)/account/page.tsx` | `withSignInRedirect(() => getAccountService().getCurrentUser())` |
| `CreateCampaignDialog/actions.ts` | Body wrapped in `withSignInRedirect`: `getCampaignService().createCampaign(...)`, then redirect to `routeNames.campaign(dto.id)`, as today. |
| `campaign/[campaignId]/actions.ts` | Bodies wrapped in `withSignInRedirect`. Actions take the campaign's UUID (bound by the form from `CampaignDto.id`) as a `string`. `createPosterDesign` reads the `x`, `y`, `size` and `rotation` form fields into `qrPlacement`. `updateCampaign` and `createPosterDesign`: `revalidatePath(routeNames.campaign(campaignId))`, as today. |
| `DeleteAccountDialog/actions.ts` | Body wrapped in `withSignInRedirect`: `getAccountService().deleteAccount()`; catches `AccountDeletionRefusedError` instead of `APIError`. |
| `api/poster-designs/[designId]/image/route.ts` | One call to `getMyPosterDesignImage(designId)` with the raw segment (no `Number(...)`). Catches `NotAuthenticatedError` → 404 (not a redirect); `null` → 404; same `Cache-Control`. |

Server Actions stay plain `export async function`s in their `"use server"` files, each wrapping its body: `return withSignInRedirect(async () => { … })`.

**Types, routes and components:**

| File | Change |
|---|---|
| `routeNames.ts` | `campaign(id: string)` and `campaignAnalytics(id: string)` replace the `id: number` versions; the id is the campaign's UUID. New `posterDesignImage(id: string)` → `/api/poster-designs/${id}/image`. |
| `DesignPreview` | Builds the image URL with `routeNames.posterDesignImage(posterDesign.id)` (the DTO no longer has `designUrl`). Takes `PosterDesignDto`. |
| `CampaignCard`, `PosterDesigns` | Types from `CampaignDto` / `PosterDesignDto`. |
| `CampaignHeader`, `EditCampaignDialog`, `EditCampaignForm` | `CampaignDto` instead of `type PosterCampaign` from `@/db/schema` (the row type is deleted, and the domain `Campaign` has private fields, so it isn't a substitute). |
| `CampaignContext` | `id: string` (the campaign's UUID) instead of `id: number`. It's the source of the id the forms pass to the actions. |
| `CreateCampaignDialog`, `EditCampaignForm`, `PosterDesignFields` | Validation from `@application/validation`. |
| `PosterDesignFields`, `CreatePosterDesignDialog` | QR inputs are named `x`, `y`, `size` and `rotation`, and read `min`/`max`/`step` from `QrPlacement.RANGES[name]`. |
| `drawPoster.ts` | Its own `type QrPlacement` (today a `Pick` of the Drizzle `PosterDesign` row, which moves into infrastructure) is replaced by `type DrawableQrPlacement = PosterDesignDto["qrPlacement"]` (`x`, `y`, `size`, `rotation`). The new name avoids a clash with the domain's `QrPlacement` class, which is importable from `src/`. `DEFAULT_TARGET` (what a new campaign's form is pre-filled with, and the QR fallback for an empty target) moves here from `src/data/campaignValidation.ts`, since it's a presentation concern; `CreateCampaignDialog` imports it from here. |
| `usePosterCanvas.ts` | Uses `DrawableQrPlacement`. |
| `SocialSignOn` | Imports the `BetterFetchOption` type from `@infrastructure/auth/authClient` instead of `better-auth/react`. |

`src/data/`, `src/db/`, `src/auth/`, `src/email/` and `src/imageStorage/` are removed; their contents move to the other layers.

## Error handling
Application and domain errors are turned into UI responses here:
| Error | Response |
|---|---|
| `NotAuthenticatedError` | `redirect(routeNames.signIn)`, by `withSignInRedirect` (below). In the image route, 404 instead. |
| `AccountDeletionRefusedError` | Its message, shown in the delete account dialog. |
| `NotFoundError` | `notFound()` in pages (or the `null` → 404 handling pages already do); thrown from actions, as today. |
| `ValidationError` | Thrown from actions, as today. The forms validate first with the same domain rules, so these only happen for tampered requests. |

### `withSignInRedirect`
`src/utils/withSignInRedirect.ts` exports `withSignInRedirect<T>(fn: () => Promise<T>): Promise<T>`. It runs `fn`. If `fn` throws `NotAuthenticatedError`, it calls `redirect(routeNames.signIn)`. It **rethrows every other error** unchanged, including Next's own `notFound()` and `redirect()` errors (call `unstable_rethrow(error)` first in the `catch`), so a page or action that calls `notFound()` or `redirect()` inside `fn` still works.

Today `requireUserId()` redirects from inside the data layer, so every data call redirects automatically. Now that redirecting is a presentation concern, this helper is the one place that does it, and every entry point in the table above uses it. The `(app)/layout.tsx` guard isn't enough on its own: layouts don't re-render on client navigation, and Server Actions don't run through them (see Next's `authentication.md` guide, "Layouts and auth checks").

## Per-request caching
Today `getMyCampaign` is wrapped in React `cache()` so the `@pageNav` layout and the page share one query. Services are process-wide singletons, so per-request caching belongs here. `campaign/[campaignId]/getCampaign.ts` exports `getCampaign(id): Promise<CampaignDto | null>`, and the page, analytics page and `@pageNav` layout use it. It calls `withSignInRedirect(() => getCampaignService().getMyCampaign(id))`, wrapped in React `cache()` and keyed by the id so the three share one query.

It returns `null` rather than calling `notFound()`, so each caller keeps today's behaviour: the two pages call `notFound()`, and the `@pageNav` layout renders nothing.

## Better Auth exceptions
Sign-in, sign-up, sign-out and password reset keep using Better Auth's browser client and route handler: behaviour doesn't change, the Google OAuth callback and OAuth proxy need the route anyway, and there's no business logic to put in the application layer. Wrapping them in Server Actions would mean re-implementing cookie handling and losing `useSession`.

These are the only allowed infrastructure imports, allow-listed in the ESLint rule:
- `app/api/auth/[...all]/route.ts` imports `auth` from `@infrastructure/auth/betterAuth` and `toNextJsHandler` from `better-auth/next-js`: `export const { GET, POST } = toNextJsHandler(auth)`, as today. Importing `auth` is build-safe (see [`betterAuth.ts`](../infrastructure/README.md#betterauthts)).
- Client Components (log-in, sign-up, password reset forms, `SocialSignOn`, `SignOutButton`, `useRedirectIfSignedIn`) import `@infrastructure/auth/authClient` (including the re-exported `BetterFetchOption` type, so nothing in `src/` imports `better-auth/react`).
- Auth forms import `@infrastructure/auth/passwordRules` (`MIN_PASSWORD_LENGTH`, `RESET_EMAIL_INTERVAL_SECONDS`).

## Tests
Presentation is covered by end-to-end tests, not unit tests against fake services. A session that expires mid-use should redirect to log in, both on navigation and on form submit.
