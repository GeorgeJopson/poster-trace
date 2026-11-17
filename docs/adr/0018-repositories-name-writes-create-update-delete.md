# Repositories name their writes create, update and delete

This partly supersedes ADR-0012: `CampaignRepository.save` is split into `create` and `update`. The rest of ADR-0012 still applies to the designs both of them write.

Every repository method starts with one of four verbs: `create`, `update`, `delete` or `find`. A qualifier can follow (`findByIdForOwner`, `createAll`). Writes used to be named however each repository happened to grow (`save`, `add`, `addAll`, `addRegistration`), so you couldn't tell from a name whether a write inserts, overwrites or upserts.

- **`create` only inserts.** A duplicate id is a bug, because the domain assigns ids (ADR-0004), so it throws an unexpected error and no domain error is defined for it.
- **`update` only changes what's stored.** It throws `NotFoundError` if the row is missing or belongs to someone else (ADR-0005).
- **The verb describes the whole aggregate, and `<verb><Part>` describes one part of it.** A part is only written on its own when a write to the whole aggregate can't express the change. `PosterRepository.createRegistration` is the only example: it updates the Poster aggregate, but it inserts the registration and must fail when someone else got there first (ADR-0016).
- **A method exists only when a use case calls it.** No repository gets `delete` until something deletes through it.
- **Read-only lookups (`ScanTargetLookup`, `ScanCountLookup`) aren't repositories** and keep their own names.

## Considered Options

- **Keep `CampaignRepository.save` as an upsert.** ADR-0012 chose this so the aggregate needn't carry a "new" flag. It was rejected because the calling use case always knows whether it's creating a campaign or changing one, and an upsert hides a wrong id: an edit to a campaign that doesn't exist would insert it.
- **Name the registration write `update(poster)`.** It changes the Poster aggregate, but it would write only the registration, so any other change made to a poster would be lost without warning (the risk ADR-0007 described). Naming the part keeps the insert-only behaviour visible.
