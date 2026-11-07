# Scan URLs are a permanent public contract

Every poster's QR code encodes `{POSTER_TRACE_URL}/redirect/{posterId}`, and printed posters can't be changed. So that path and how it behaves can never change. A scan of an existing poster gets a `307` to its campaign's current target with `Cache-Control: no-store`. A malformed or unknown poster id gets a plain-text `404`. The redirect works whether or not the poster is registered.

## Decisions

- **The path stays `/redirect/{posterId}`.** A shorter path such as `/p/{id}` would make QR codes less dense and quicker to scan. It was rejected because posters generated with `/redirect/` may already be up.
- **Only production's scan URLs are permanent.** A poster generated on a deploy preview or branch deploy is only stored in that deploy's database branch, so production could never find it. Its QR code therefore points at the deploy's own URL (`DEPLOY_PRIME_URL`), and it stops working when the deploy is deleted. Previews are throwaway, as they are for images (ADR-0013).
- **The redirect is never cacheable.** A permanent redirect (`301`/`308`), or caching at the CDN, would make repeat scans faster. But browsers would keep sending people to an old target after the owner changed it, and scans would stop reaching the server, which is where scans are recorded (ADR-0015).
- **The target is read with one query, outside the aggregates.** Speed matters on this route, so it doesn't load the Campaign aggregate, which holds every design, and it doesn't check a session. The application read port `ScanTargetLookup` joins poster → design → campaign and returns only the target. That target still goes through `CampaignTarget.create`, as ADR-0006 requires.
