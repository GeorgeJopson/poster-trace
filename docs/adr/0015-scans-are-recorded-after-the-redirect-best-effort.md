# Scans are recorded after the redirect, on a best-effort basis

A scan's redirect (ADR-0014) never waits for the scan to be stored. The route handler takes the time the request arrived, sends the `307`, and records the scan in Next's `after()`: `ScanService.recordScan` loads the poster with `PosterRepository.findById`, calls `poster.addScan(scannedAt)`, and stores it with `PosterRepository.addNewScans(poster)`. If that fails, the error is logged and the scan is lost. Getting the scanner to the target quickly matters more than an exact count, so a few missing scans are acceptable.

## Decisions

- **`after()`, not an unawaited promise.** On Netlify the function can freeze as soon as the response is sent, so a bare promise would silently drop scans as a matter of course, not occasionally. `after()` keeps the function alive until the work finishes. It's called from the route handler, so the application layer doesn't depend on Next.
- **A loaded Poster holds only its new scans.** A poster can collect thousands of scans, and loading them all to append one would slow down every scan. `findById` returns a Poster with no past scans, `addScan` adds to its new scans, and stored scans are read through separate queries.
- **`addNewScans` is a per-intent repository method**, a deliberate exception to ADR-0012. It only inserts the poster's new scans and never touches stored ones. Scans are the only thing about a Poster that changes, so the risk ADR-0012 guards against (a change saved through the wrong method and lost) barely applies.
- **A poster deleted before the scan is recorded is skipped without an error.** Its scans would have been deleted along with it anyway.
- **Scan ids are domain-generated UUIDs** (ADR-0004), and the time comes from the request rather than from when the background work runs.

## Considered Options

- **Awaiting the insert before redirecting.** It was rejected because every scan would wait on a database write.
- **A queue or background function.** It was rejected because it adds infrastructure to make a count exact when it doesn't need to be.
