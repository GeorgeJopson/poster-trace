# PosterRepository saves the whole poster

This supersedes ADR-0016's decisions that a registration is persisted by intent with `PosterRepository.addRegistration` and that the database enforces "first registration wins" a second time. Now that scans are their own aggregate (ADR-0017), a poster's registration is the only thing about it that changes after it's generated. So `PosterRepository` follows ADR-0012 and saves the whole aggregate: `save(poster)` and `save(posters)` replace `addAll` and `addRegistration`. A new poster mutation no longer needs its own repository method.

## Decisions

- **`save` upserts and never overwrites.** The poster row is inserted with `ON CONFLICT (id) DO NOTHING`, as nothing on it changes. The registration row is inserted with `ON CONFLICT DO NOTHING` on its `poster_id` key, so a stored registration is never replaced.
- **One transaction per save.** Saving many posters is all or none.
- **Only `poster.register(...)` enforces first registration wins** (ADR-0016). It throws `AlreadyRegisteredError` for a loaded poster that's already registered. The repository doesn't check for it and never throws it.
- **The race is accepted on purpose.** If two people load the same unregistered poster and both submit between `findById` and `save`, the first stored registration is kept and the second `save` writes nothing and succeeds. The second person is told the poster is registered with their name and location, though it isn't. The repository can't tell this apart from saving an already-registered poster again unchanged, which conflicts in the same way. The window is a few milliseconds, and the stored registration is never overwritten, so we accept it.
- **A poster id stored under a different design is ignored.** Poster ids are random and assigned by the domain (ADR-0004), so this can't happen in practice, and `save` doesn't check for it.

## Considered Options

- **Keeping `addRegistration` insert-only and throwing on a conflict.** This told the second person in a race the truth, but it kept a per-intent method, which ADR-0012 moved away from, for a race that almost never happens.
- **`save` plus `saveAll`.** Rejected in favour of one overloaded `save`, as both take the same path.
