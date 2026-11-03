# Four-layer DDD architecture, with lint-enforced import rules

Poster Trace is split into Domain-Driven Design layers, each in its own root folder with a path alias: `domain/`, `application/`, `clientApplication/` (the application layer for Client Components), `infrastructure/`, `di/` (the composition root) and `src/` (presentation, i.e. Next.js). Before this there was barely any structure: data access, auth and validation were mixed together in `src/`. The layers make the business rules testable without Next, Drizzle or Better Auth. An ESLint `no-restricted-imports` rule per folder (`eslint.config.mjs`) enforces which layer may import which, so the layering doesn't wear away over time. `di/`, `scripts/` and `tests/` have no import restrictions.

## Consequences

- Only today's features are modelled. Posters and scans have tables but no entities, repositories or use cases until a feature needs them.
- The redesign was merged as a single branch with a destructive schema migration (all campaign and design data was discarded), so production can't be rolled back to a deploy from before it. Fixes roll forward.
