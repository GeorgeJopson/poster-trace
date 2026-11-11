# Coding Standards

Rules for review. Lint already enforces which layer may import which (`eslint.config.mjs`), so this file covers only what lint can't catch. The layers and the reasons behind them are in `docs/adr/`. Use the domain words from `GLOSSARY.md`.

| Layer              | Folder               |
| ------------------ | -------------------- |
| Presentation       | `src/`               |
| Application        | `application/`       |
| Client application | `clientApplication/` |
| Domain             | `domain/`            |
| Infrastructure     | `infrastructure/`    |
| Composition root   | `di/`                |

## Domain

- **Browser-safe.** Domain files never import `server-only`, because the value objects' rules also run in forms.
- **Value objects** are immutable classes with a private constructor and a static factory that validates and throws `ValidationError`. The factory is the only way to check a value. `ValidationError` messages are shown to users, so write them for users.
- **Ids** are branded strings. `as XxxId` appears only inside that id's own `generate` / `from` / `parse`. Ids that come from URLs go through `parse`, which returns `null` for anything that isn't a UUID.
- **Entities** have two factories. `create` builds a new entity and generates its id. `restore` rebuilds a stored entity and generates nothing; only repositories call it. `Poster`'s `create` is called `generate`, the glossary's word for making posters. `Scan` has no `restore`, as scans are never loaded (see ADR-0017).
- **Repositories** take and return entities, never Drizzle rows. They store the ids the domain generated, never read the session, and take an explicit `ownerId` for owner-facing reads (see ADR-0005).
- **Aggregate changes are persisted with the repository's `save`**, which writes the whole aggregate (see ADR-0012 and ADR-0018). A new mutation needs no repository method, but the in-memory fakes must keep matching the Drizzle repositories' `save` rules. The exception is the insert-only `ScanRepository.add` (see ADR-0015 and ADR-0017).

## Application

- **Owner-facing use cases call `requireUserId` first**, before any validation, id parsing or repository call. A signed-out request must get `NotAuthenticatedError` whatever its input.
- **Use cases return plain, serialisable DTOs**, never entities. Class instances can't cross from Server to Client Components.
- **Server-only.** Every `services/` file imports `server-only`. `dto/` (types only), `validation/` (pure functions) and `files/` (reading uploaded files, shared by services and forms) stay browser-safe and never import it.
- **Services call the domain factories directly**; the `validation/` functions are for forms only. Any check that needs the database or session belongs in a service and reaches the form through a Server Action.
- **Constructor injection.** A class never calls `new` on a dependency or imports a module-level singleton (Better Auth's `auth` is the one exception, see ADR-0002).

## Infrastructure

- **Nothing connects at import time.** `next build` imports these modules without credentials.
- **`tests/application/fakes/` mirror the Drizzle repositories' behaviour**, including what they _don't_ write. Change both together.

## Presentation

- **Every service call from a page, layout, `@pageNav` slot or Server Action goes through `withSignInRedirect`.** The layout guard isn't enough, because layouts don't re-render on client navigation and Server Actions don't run through them. Two route handlers are exceptions: the image route maps `NotAuthenticatedError` to a 404, and the scan redirect route (`/redirect/[posterId]`) never checks a session, because anyone can scan a poster (see ADR-0014).
- **Services come from `@di/container` getters.** Client Components never call services; they get DTOs through props, or call Server Actions.
- **Forms validate through `@application/validation`**, not by calling domain factories. They may read domain constants such as `CampaignTarget.MAX_LENGTH` and `QrPlacement.RANGES`.
- **Client Components reach auth through `@clientApplication`.**
- **Per-request caching** (React `cache()`) lives in presentation, because services are process-wide singletons.

## Tests

- **Test at the layer boundaries**, in `tests/<layer>/`. Construct the class under test directly with fakes for its constructor arguments. Tests never use `di/`.
- **Presentation is covered by end-to-end tests** in `tests/e2e/`. Find elements by role and label, not by CSS classes.
- **Pure helpers in `src/utils/`** with logic worth checking on its own (e.g. `drawPosterPdf`) may also get unit tests in `tests/presentation/`.
