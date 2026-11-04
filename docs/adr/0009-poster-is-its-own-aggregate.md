# Poster is its own aggregate, referencing its design by id

A `Poster` is an aggregate of its own (`domain/poster/`), outside the Campaign aggregate, even though it belongs to a poster design that lives inside Campaign. It holds only the `PosterDesignId`. A campaign can have far more posters than designs, and posters gain their own lifecycle (registration, scans) that never changes the campaign, so loading every poster with its campaign would make the aggregate large for no benefit.

Because the design is an entity inside another aggregate, ownership is checked by going through the Campaign: `PosterService` loads the campaign with `findByIdForOwner`, confirms the design is one of `campaign.getDesigns()` (throwing `NotFoundError` otherwise, per ADR 0005), and only then generates posters for `design.id`. `PosterRepository` stores them.

## Consequences

- Callers have to pass the campaign id along with the design id, because there's no lookup from a design to its campaign.
- Deleting a campaign still deletes its posters, through the database's cascading foreign keys rather than through the domain.
