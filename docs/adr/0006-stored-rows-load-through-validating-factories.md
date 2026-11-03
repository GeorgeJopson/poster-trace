# Stored rows load through the validating factories

Repositories rebuild value objects from stored rows with the same validating factories that check user input (`CampaignTarget.create`, `QrPlacement.create`, etc.). There's no separate path that skips validation. That keeps one source of truth for every rule, but it means a stored value that breaks a rule fails to load. This is an accepted risk: **when a rule is tightened** (target length, URL schemes, QR ranges), the stored data must be checked or migrated at the same time, or the affected campaigns, and every page that loads them, break.
