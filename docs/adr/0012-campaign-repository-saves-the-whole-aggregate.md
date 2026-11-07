# CampaignRepository saves the whole aggregate

This supersedes ADR-0007. `CampaignRepository` now has a single `save(campaign)` in place of `add`, `updateDetails` and `addDesign`. One method per kind of change meant every new aggregate mutation needed its own repository method, matched exactly in the in-memory fake, and a mutation saved through the wrong method was silently lost. `save` writes whatever the aggregate holds, so new mutations need no repository changes.

## Decisions

- **A new design carries its image upload until it's saved.** `Campaign.addDesign` takes the `PosterDesignImageUpload`, and `save` stores the blob for any design that has one. Restored designs never have one, so the domain still sees image keys only during account deletion (ADR-0008).
- **New or existing is decided by an owner-scoped upsert**, not a flag on the aggregate. If the campaign id exists under another owner, nothing is written and `save` throws `NotFoundError` (ADR-0005).
- **Existing designs get their QR placement updated**, scoped to the campaign. Their image key is never changed. If a design that's already stored still carries a new image (the same object saved twice), the newly uploaded blob is deleted. A design stored under another campaign, or one that isn't stored and has no image, throws `NotFoundError`.
- **`save` never deletes a design because it's missing from the aggregate.** A stale copy of a campaign could otherwise delete a design another request had just added, along with its posters and image. Removing a design will need an explicit way to say so.
- **One transaction per save.** New blobs are written first and deleted if the transaction fails.
- **The last write wins.** There's no version check, the same as before.

## Considered Options

- **A separate image store port**, where the service uploads the image and the design holds the returned ref. It was rejected because it spreads image refs through the domain and leaves an orphaned blob when the save fails.
- **`save(campaign, images)`**, an optional map from design id to upload. It was rejected because it brings back a per-intent argument.
