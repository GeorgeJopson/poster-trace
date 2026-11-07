# CampaignRepository persists by intent, not the whole aggregate

Superseded by ADR-0012: the repository now saves the whole aggregate with `save(campaign)`.

`CampaignRepository` has one method per kind of change instead of a generic `save(campaign)`. `updateDetails` writes only the campaign's name and target and never its designs. Designs are written only through design-specific methods (today just `addDesign`). This keeps each write small and explicit. The cost is that a new aggregate mutation that calls `updateDetails` would silently do nothing to the designs, so every new mutation needs its own repository method, and the in-memory fake in `tests/application/fakes/` has to behave the same way as the Drizzle repository.

## Considered Options

- **A separate image repository.** The three image methods (`findDesignImageForOwner`, `findAllDesignImageRefsByOwner`, `deleteDesignImages`) read or delete image content rather than persist the aggregate. They stay on `CampaignRepository` anyway, because the images belong to the campaign's designs and a separate repository would add a type and wiring for three methods.
