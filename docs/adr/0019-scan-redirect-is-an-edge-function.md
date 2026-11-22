# The scan redirect is a Netlify Edge Function, outside Next and the layers

This supersedes ADR-0015's decision to record scans in Next's `after()`, and ADR-0014's decisions that the target is read through `ScanTargetLookup` and checked with `CampaignTarget.create`. `/redirect/{posterId}` is served by `netlify/edge-functions/redirect.ts`, not by a Next route. On a cold scan, about 3.4 s of 4.2 s went on Netlify starting the Next server function before 5 ms of redirect code ran (`docs/perf/2026-11-22-redirect-timing.md`). An edge function starts in tens of ms, so a cold scan now waits mostly on the database. Recording scans best-effort after the redirect (ADR-0015) is unchanged.

## Decisions

- **The edge function repeats the rules a scan needs instead of importing the layers.** The edge runtime is Deno, which needs file extensions and doesn't read tsconfig `paths`, so it can't load `ScanService` or the Drizzle adapters. It has its own UUID check, target query, and scan insert that skips a poster deleted in the meantime. A comment at the top of the file lists the code it must stay in step with. This is a deliberate exception to ADR-0001's layering.
- **The stored target is followed without being checked again**, a deliberate exception to ADR-0006. Only `CampaignTarget.create` writes targets, so every stored one has already passed its rules. Re-checking would mean a third copy of those rules to keep in step. If the rules on targets are tightened, the stored targets must be migrated at the same time, as ADR-0006 already requires. Browsers also ignore a `Location` header that isn't a web address, such as `javascript:`.
- **An unknown or malformed poster id gets a "poster not found" page, with a `404`.** This replaces ADR-0014's plain-text `404`. Someone scanning an old poster now sees an explanation instead of the bare words "Not found". The edge function fetches the Next page at `/poster-not-found` and returns its HTML with status `404` and `Cache-Control: no-store`, so the scan URL stays in the address bar. It passes on the request's headers so that a deploy preview's access protection lets the page through. A redirect to the page was rejected because an unknown poster would then look like a successful redirect.
- **It queries with `getDatabase().sql`, not Drizzle.** Two short queries don't need the schema or the ORM. It sends `scanned_at` as an ISO string, as Drizzle does: the column has no time zone and holds UTC, and the driver would turn a raw `Date` into local time.
- **`context.waitUntil` replaces `after()`.** It does the same job: it keeps the edge function alive until the scan is stored, without making the scanner wait.
- **The Next route is gone, with no fallback.** Keeping it behind `onError: "bypass"` would give a second implementation of a permanent contract that no test exercises.

## Considered Options

- **Pre-bundling the layers with esbuild into the edge function.** It was rejected because it adds a build step, a generated file and a watch process for `netlify dev`, just to reuse about 30 lines of rules.
- **Making the shared code Deno-compatible**, with `.ts` extensions, an import map and no `server-only` in `ScanService`. It was rejected because the scan path would then use a different import style from the rest of the codebase.
- **A small standalone Netlify Function on Node.** It was rejected because it would start in hundreds of ms rather than tens, with the same duplication.
- **A scheduled ping to keep the Next function warm.** It was rejected because it doesn't help when Netlify starts an extra instance, and it would stop the database from scaling to zero.
