# Authentication is a generic subdomain owned by Better Auth

The domain has no authentication concept and no password rules. It only knows _who_ a user is (`UserId`, assigned by Better Auth) and _what they own_. The application reaches auth through two ports: `SessionProvider` (who is signed in) and `AccountGateway` (delete the account). Sign-in, sign-up, sign-out and password reset keep Better Auth's browser client and route handler, called through `clientApplication/`, instead of being wrapped in Server Actions. Wrapping them would mean re-implementing cookie handling, losing `useSession`, and still keeping the route for the Google OAuth callback and the OAuth proxy.

## Consequences

- Rate limiting stays in the Better Auth config: the per-IP limit, plus the per-account reset email cooldown (`tryClaimResetEmailCooldown`, called from `sendResetPassword`).
- `infrastructure/auth/passwordRules.ts` mirrors Better Auth's settings. Auth forms read it through `ClientAuthService`, so it has to stay browser-safe.
- `src/app/api/auth/[...all]/route.ts` is the only presentation file allowed to import infrastructure.
