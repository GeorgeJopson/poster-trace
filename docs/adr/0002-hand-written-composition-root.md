# Hand-written composition root, no DI library

Every service, repository and gateway takes its dependencies through its constructor, typed as interfaces. `di/container.ts` is the only place in the app that wires concrete infrastructure to those interfaces. It uses lazy, memoised getters, so nothing connects to the database at import or build time. We chose not to use tsyringe or InversifyJS: they need decorator metadata, which is awkward with Next's SWC/Turbopack builds, and they're more machinery than an app this size needs.

## Consequences

- **Better Auth is the one exception.** `infrastructure/auth/betterAuth.ts` exports a module-level `auth`, which both di and the auth route import. The module is already build-safe (`db` is a lazy Proxy, and Resend loads on first send), and no test needs to inject into the config, so a factory would add code for nothing.
- Services are process-wide singletons, so they must be stateless. Per-request state lives outside the container: `BetterAuthSessionProvider` memoises with React `cache()`, and presentation's `getCampaign` does the same for per-request query caching.
- Tests never use `di/`. They construct the class under test directly, with fakes.
