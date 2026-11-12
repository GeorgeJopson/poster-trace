# A poster's first registration wins

Partly superseded by ADR-0018: registrations are saved with `PosterRepository.save` rather than `addRegistration`. It still never overwrites a stored registration and still throws `AlreadyRegisteredError` when someone else's was stored since the poster was loaded.

Anyone who reads a poster's QR code on the public register page can register it, and that includes passers-by as well as the helper who put it up. A poster can be registered only once, so a later attempt is rejected as "already registered" rather than replacing the stored registration. Letting the latest registration win would let anyone overwrite a helper's poster name and location just by walking past the poster. We'd rather a helper occasionally lose the race to register than have every registration open to vandalism.

## Decisions

- **Registration is a value object owned by Poster**, with no id of its own. It never changes after it's made and is only ever reached through its poster, so the poster's id identifies it. ADR-0009's Poster aggregate now holds it.
- **The rule is enforced twice.** `poster.register(...)` throws if the poster already has a registration, so `PosterRepository.findById` loads the registration, which is cheap because there's at most one. The registration table is keyed by `poster_id`, so if two people submit at the same moment the database rejects the second, and the repository reports it as the same "already registered" error.
- **It's persisted by intent** with `PosterRepository.addRegistration`, which only ever inserts. This is the same deliberate exception to ADR-0012 that `addNewScans` made (ADR-0015), which is now `ScanRepository.add` (ADR-0017).

## Considered Options

- **The latest registration replaces the earlier one.** This handles a poster being moved, but any passer-by could overwrite a registration. It was rejected.
- **Keeping every registration as a history.** It was rejected because a poster has one place and one name at a time, and a history doesn't stop vandalism. It only records it.

## Consequences

- A poster that gets moved, or that a passer-by registers first, can't be corrected from the register page. If a fix is needed, it would come from the campaign owner on the dashboard, as a separate feature.
