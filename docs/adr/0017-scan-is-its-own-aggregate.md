# Scan is its own aggregate, referencing its poster by id

This supersedes ADR-0015's decisions that a loaded Poster holds its new scans and that `PosterRepository.addNewScans` stores them, and amends ADR-0009: a poster's lifecycle is now only its registration. A `Scan` is an aggregate of its own (`domain/scan/`) that holds only the `PosterId` of the poster it was read from. `ScanService.recordScan` creates it with `Scan.record(posterId, scannedAt)` and stores it with `ScanRepository.add(scan)`, without loading the poster.

Recording a scan used to load the poster (a select joined to its registration) only to append to it. Nothing about the poster's state decides whether a scan is recorded: every scan counts, registered or not, so the Poster aggregate had no invariant to protect and the load was pure cost on every scan.

## Decisions

- **`ScanRepository` only adds scans.** Stored scans are never changed or deleted, the same as before (ADR-0015).
- **The read-side lookups stay as application ports.** `ScanTargetLookup` reads a campaign's target and never touches scans (ADR-0014), and `ScanCountLookup` returns counts, not Scan aggregates, so neither belongs on a domain repository.
- **A poster deleted before its scan is recorded is still skipped without an error.** There's no existence check before the insert, so `ScanRepository.add` treats the foreign key violation as a no-op. The redirect confirmed the poster existed moments earlier, so this only happens in that race, and the scan's would-be row would have been deleted with the poster anyway.

## Considered Options

- **Keeping scans in the Poster aggregate.** It was rejected because every scan paid for a load that protected no invariant.
- **Folding the two lookups into `ScanRepository`.** It was rejected because a repository would then answer questions about Campaign and return read models, not aggregates.
- **Checking the poster exists before inserting.** It was rejected because it brings back a read on every scan to handle a rare race.
