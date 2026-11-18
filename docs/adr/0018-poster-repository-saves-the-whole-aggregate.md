# PosterRepository saves the whole aggregate

This supersedes ADR-0016's decisions that a registration is persisted by intent with `PosterRepository.addRegistration` and that the first-registration rule is enforced twice. `PosterRepository` now has `save(poster)` and `save(posters)` in place of `addAll` and `addRegistration`, the same as `CampaignRepository.save` (ADR-0012), which closes the exception to ADR-0012 that `addRegistration` was. `ScanRepository.add` stays insert-only, because scans are append-only events (ADR-0017).

## Decisions

- **`save` writes whatever the posters hold.** Each poster row is upserted by id. A poster that has a registration has it upserted by poster id, with every column overwritten. The repository doesn't assume any field never changes: that's the domain's job.
- **`save` never deletes a registration because it's missing from the poster.** A stale copy of a poster, loaded before someone registered it, would otherwise delete their registration.
- **One transaction per save**, so a batch of posters is stored all or none, as `addAll` was.
- **Only the domain enforces first-registration-wins.** `poster.register` throws `AlreadyRegisteredError` for a registered poster, as before. The repository no longer rejects a second registration, so if two people submit a registration for the same poster at exactly the same moment, the last one saved wins.

## Why the race is accepted

The domain already stops the vandalism ADR-0016 is about: anyone who loads a registered poster can't register it again. The race only happens when two registrations of one poster arrive at exactly the same time, which won't happen in real use. Even if it did, little harm is done, as a vandal can't time their submission to land at the same moment as the real helper's.

## Considered Options

- **Keeping the database's check**, by inserting the registration with `ON CONFLICT DO NOTHING` and throwing `AlreadyRegisteredError` when a different one is already stored. It was rejected as complexity for a race that won't happen.
