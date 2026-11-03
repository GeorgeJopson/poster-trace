# Client Application Layer

The application layer for Client Components. Lives in `clientApplication/` (alias `@clientApplication/*`). Server code uses [application](../application/README.md) services from [di](../dependency-injection/README.md) instead; those are `server-only`, because they reach the database, Netlify Blobs and the request's session.

**Rules**
- Bundled for the browser, so it only imports browser-safe infrastructure: `@infrastructure/auth/authClient` (Better Auth's browser client) and `@infrastructure/auth/passwordRules`. No frameworks, no `server-only`, no `@di/*`, and no application services or ports.
- Presentation imports it instead of infrastructure. Results are plain objects (`AuthResult`), so Better Auth's types and error codes stay out of `src/`.
- Hooks are named `use…` (e.g. `AccountService.useUserEmail()`), so React's hooks lint rule checks their call sites.
- Constants are read through `get…` methods (e.g. `AuthService.getMinPasswordLength()`).
- Enforced by an ESLint `no-restricted-imports` rule on `clientApplication/`.

## Services
| Service | Members |
|---|---|
| `AuthService` | `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut`, `requestPasswordReset`, `resetPassword` (reports an expired or used token as `isTokenInvalid`), `getMinPasswordLength`, `getResetEmailIntervalSeconds` |
| `AccountService` | Hooks: `useUserEmail` (`""` while loading or signed out), `useIsSignedIn` |

## Tests
`tests/clientApplication/AuthService.test.ts` unit tests `AuthService` with the Better Auth client mocked. The flows end to end are covered by `tests/e2e/auth.spec.ts`.
