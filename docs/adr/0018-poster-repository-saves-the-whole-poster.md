# PosterRepository saves the whole poster

This supersedes ADR-0016's decision that a registration is persisted by intent with `PosterRepository.addRegistration`. Now that scans are their own aggregate (ADR-0017), a poster's registration is the only thing about it that changes after it's generated. So `PosterRepository` follows ADR-0012 and saves the whole aggregate: `save(poster)` and `save(posters)` replace `addAll` and `addRegistration`.

## Decisions

- **`save` only inserts.** The poster row is inserted with `ON CONFLICT (id) DO NOTHING`, as nothing on it changes. The registration row is inserted with `ON CONFLICT DO NOTHING` on its `poster_id` key, so a stored registration is never replaced. Unlike `CampaignRepository.save`, nothing stored is ever updated, because no poster mutation changes stored data yet. A future mutation that does (renaming a poster, correcting a location) must add an update path to `save` first, or its changes would be silently dropped.
- **First registration wins is still enforced twice** (ADR-0016). `poster.register(...)` throws `AlreadyRegisteredError` for a loaded poster that's already registered. If the registration insert conflicts, `save` reads the stored registration: if it's the same as the poster's, this is the poster being saved again and nothing happens; if it differs, someone else registered the poster since it was loaded, and `save` throws `AlreadyRegisteredError`. So the second person in a race is told the truth.
- **One transaction per save.** Saving many posters is all or none, including when one of them throws `AlreadyRegisteredError`.
- **A poster id stored under a different design is ignored.** Poster ids are random and assigned by the domain (ADR-0004), so this can't happen in practice, and `save` doesn't check for it.

## Considered Options

- **Keeping `addRegistration` insert-only.** It reported the race correctly, but kept a per-intent method, which ADR-0012 moved away from.
- **Letting a conflicting `save` succeed silently.** Simpler, but the second person in a race would be told their registration was stored when it wasn't.
- **`save` plus `saveAll`.** Rejected in favour of one overloaded `save`, as both take the same path.
