# The domain assigns its own UUID ids

Campaigns and poster designs get a UUID (`crypto.randomUUID()`) when they're created in memory (`Campaign.create`, `Campaign.addDesign`), before anything is saved. Their `uuid` columns have **no database default**, so an insert without an id fails instead of the database quietly making one up. Entities are therefore complete before they're persisted, and repositories only store the ids they're given. Campaign URLs use the UUID directly (`/dashboard/campaign/{CampaignId}`), with no slugs.

## Consequences

- `UserId` is the exception: Better Auth assigns user ids, and the domain only refers to them.
- Random UUIDs don't sort by age, so lists order by `created_at`. If index locality ever matters, `generate()` is the one place to switch to time-ordered v7 UUIDs.
- Ids are branded strings rather than classes, so they cross into Drizzle, URLs, JSON and Client Components without being unwrapped, and they can be compared with `===`.
