# Dependency Injection

The composition root: the only place in the app that wires infrastructure implementations to domain/application interfaces. Lives in `di/` (alias `@di/*`).

**Rules**
- **Constructor injection everywhere.** Every service, repository and gateway is a class whose dependencies are passed to its constructor, typed as interfaces (domain repositories, application ports, or infrastructure's internal `BlobStore`). No class calls `new` on a concrete dependency or imports a module-level singleton.
- **One exception: Better Auth.** `infrastructure/auth/betterAuth.ts` exports a module-level `auth`, as today (see [`betterAuth.ts`](../infrastructure/README.md#betterauthts)). di imports it to build the Better Auth adapters, and the auth route imports it directly.
- Within the app, `di/` is the only folder that imports concrete infrastructure classes (apart from the [Better Auth exceptions](../presentation/README.md#better-auth-exceptions)). `scripts/` and `tests/` are outside the app and may construct infrastructure directly (see [Dependency rules](../ARCHITECTURE_REDESIGN_PLAN.md#dependency-rules)).
- No DI library: tsyringe / InversifyJS need decorator metadata, which is awkward with Next's SWC/Turbopack builds, and is more machinery than this app needs.

## `di/container.ts`
Exports lazy getters, each memoising a process-wide singleton. Objects are only created when first used, so nothing connects to the database at import or build time.

| Getter | Exported | Builds |
|---|---|---|
| `getCampaignService()` | ✓ | `CampaignService(sessionProvider, campaignRepository)` |
| `getPosterDesignService()` | ✓ | `PosterDesignService(sessionProvider, campaignRepository)` |
| `getAccountService()` | ✓ | `AccountService(sessionProvider, userRepository, campaignRepository, accountGateway)` |
| `getSessionProvider()` | | `BetterAuthSessionProvider(auth)` |
| `getAccountGateway()` | | `BetterAuthAccountGateway(auth)` |
| `getUserRepository()` | | `DrizzleUserRepository(getDb())` |
| `getCampaignRepository()` | | `DrizzleCampaignRepository(getDb(), new NetlifyBlobStore(NetlifyBlobStore.POSTER_DESIGN_STORE, NetlifyBlobStore.deletesAllowedIn(NETLIFY_CONTEXT)))` |

```ts
// di/container.ts
import "server-only";
import { auth } from "@infrastructure/auth/betterAuth";

let campaignRepository: CampaignRepository | undefined;
function getCampaignRepository() {
  return (campaignRepository ??= new DrizzleCampaignRepository(
    getDb(),
    new NetlifyBlobStore(
      NetlifyBlobStore.POSTER_DESIGN_STORE,
      NetlifyBlobStore.deletesAllowedIn(process.env.NETLIFY_CONTEXT),
    ),
  ));
}

let sessionProvider: SessionProvider | undefined;
function getSessionProvider() {
  return (sessionProvider ??= new BetterAuthSessionProvider(auth));
}

let campaignService: CampaignService | undefined;
export function getCampaignService() {
  return (campaignService ??= new CampaignService(
    getSessionProvider(),
    getCampaignRepository(),
  ));
}
```
```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from "@infrastructure/auth/betterAuth";
export const { GET, POST } = toNextJsHandler(auth);
```
```ts
// src/app/(app)/dashboard/page.tsx
const campaigns = await withSignInRedirect(() =>
  getCampaignService().listMyCampaigns(),
);
```

## Scoping
- Services are **process-wide singletons** (one per Netlify Function instance). They're stateless, so this is safe.
- **Per-request state** isn't held in the container. `BetterAuthSessionProvider` reads `headers()` itself and memoises with React `cache()`; per-request query caching lives in [presentation](../presentation/README.md#per-request-caching). `NetlifyBlobStore` looks up its Blobs store on every call, so it never holds one request's Blobs credentials (see [`BlobStore`](../infrastructure/README.md#blobstore--netlifyblobstore)).
- `getDb()` returns today's lazy Proxy, with its `globalThis` reuse across hot reloads, so importing `auth` never connects (see [`db/client.ts`](../infrastructure/README.md#dbclientts)). Resend and the email templates load only on the first password reset email, as today.

## `scripts/seed.ts`
Runs under `tsx`, outside Next, so it can't import `di/container.ts` (`server-only`, `headers()`).
- **It keeps its own database connection.** It does **not** use `getDb()`, which reads `NETLIFY_DB_URL` and could point at a hosted database, which the seed would wipe (it deletes all poster data first). It keeps today's `getLocalConnectionString()` (which drops `NETLIFY_DB_URL` and asks `netlify database connect --json` for the local database) and its own `drizzle-orm/node-postgres` client. The seed is test tooling, so it's better for it to be slightly more complicated than for it to shape the app's code.
- **It reuses only** `infrastructure/db/schema.ts`, `NetlifyBlobStore` (with `NetlifyBlobStore.POSTER_DESIGN_STORE` and `deletesAllowedIn`, so the store name and delete rule aren't repeated), `connectToLocalBlobStorage()`, and the domain id factories and value objects.
- **It sets up Blobs before using the store.** It awaits `connectToLocalBlobStorage()` (which sets the Blobs environment) before constructing `NetlifyBlobStore`.
- **It generates the domain's ids and the blob keys**, since neither the database nor the store assigns them: `CampaignId.generate()` and `PosterDesignId.generate()`, and `crypto.randomUUID()` for each blob key, passed to `set(key, data, "image/webp")`. The unmodelled `poster` and `scan` rows keep their database-assigned `serial` ids, read back with `.returning()` as today.
- **It builds values through the domain factories** (`CampaignTarget.create`, `QrPlacement.create`) before inserting, so an invalid seeded value fails when the seed runs, not later when a page loads it.
- **Seeded QR values use the app's units.** Today's seed uses fractions (`qrXPosition: 0.82`, `qrSize: 0.12`), but the app reads `x`/`y` as percentages (0–100) and `size` in image pixels, so every seeded QR code renders as a dot in the top-left corner. The seed uses 0–100 for `x`/`y`, a `size` in pixels that fits within its image, and a `rotation` within `0`–`360` (today's `-3` is out of range).

## Tests
Tests don't use `di/`. They construct the class under test directly, with fakes for its constructor arguments (see each layer's Tests section).
