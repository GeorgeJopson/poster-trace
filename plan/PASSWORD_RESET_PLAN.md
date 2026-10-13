# Password reset by email

Let users who signed up with an email and password reset their password from a
link sent by email. Better Auth handles the reset flow, Resend sends the email,
and React Email builds the template.

## User flow

1. On the log-in page or the account page, the user clicks **Reset my
   password**, which goes to `/password-reset`.
2. On `/password-reset`, the user enters their email (already filled in if
   they're signed in) and clicks **Send reset email**. This calls
   `authClient.requestPasswordReset({ email, redirectTo })`.
3. The page then says "If an account exists for that email, we've sent a reset
   link". The send button stays disabled for 60 seconds, with a countdown, and
   then lets the user send the email again.
4. The email links to Better Auth's `GET /api/auth/reset-password/:token`. That
   route checks the token and redirects to
   `/password-reset/authorized?token=…`, or to
   `/password-reset/authorized?error=INVALID_TOKEN` if the token is invalid or
   has expired.
5. On `/password-reset/authorized`, the user enters a new password and
   confirms it. This calls `authClient.resetPassword({ newPassword, token })`.
   When it succeeds, the user is sent to `/log-in` to log in with the new
   password.

## Scope

### New dependencies

- `resend`: the Resend Node SDK.
- `react-email` (exact-pinned) for the template components, plus
  `@react-email/ui` as an exact-pinned dev dependency for the `email dev`
  preview server.

### Environment variables

| Variable     | Purpose                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_KEY` | Resend API key. Set it locally in `.env` and in Netlify for every deploy context.                                                                                                      |
| `EMAIL_FROM` | Sender address, e.g. `Poster Trace <noreply@<verified-domain>>`. Falls back to `Poster Trace <onboarding@resend.dev>`, which Resend only delivers to the Resend account's own address. |

### Files

| Area        | File                                                                              | Change                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email       | `src/email/index.ts` (new)                                                        | `server-only` Resend client and a `sendPasswordResetEmail({ to, name, url })` function that throws if Resend returns an `error`.                                                                               |
| Email       | `src/email/templates/PasswordResetEmail.tsx` (new)                                | React Email template with a preview line, a heading, short copy, a **Reset password** button, a plain-text copy of the link, and a note that the link expires in 1 hour.                                       |
| Auth        | `src/auth/auth.ts`                                                                | Add `sendResetPassword`, `revokeSessionsOnPasswordReset` and `advanced.backgroundTasks`, and replace the "No email verification or password reset" comment.                                                    |
| Routes      | `src/routeNames.ts`                                                               | Add `passwordReset: "/password-reset"` and `passwordResetAuthorized: "/password-reset/authorized"`.                                                                                                            |
| Pages       | `src/app/(public)/password-reset/page.tsx` (new)                                  | Request page. A server component that reads the session to pre-fill the email, and renders a client form.                                                                                                      |
| Pages       | `src/app/(public)/password-reset/_components/RequestPasswordResetForm/` (new)     | Client form with an email `TextInput`, `SubmitButton`, sent message and 60 second cooldown.                                                                                                                    |
| Pages       | `src/app/(public)/password-reset/authorized/page.tsx` (new)                       | New-password page. Reads `token` and `error` from `searchParams`, and shows an "expired or invalid link" message with a link back to `/password-reset` when there's no token or `error=INVALID_TOKEN`.         |
| Pages       | `src/app/(public)/password-reset/authorized/_components/ResetPasswordForm/` (new) | Client form with **New password** and **Confirm new password** `TextInput`s (`autoComplete="new-password"`, `minLength={8}`) and `SubmitButton`.                                                               |
| Components  | `src/components/AuthCard/` (new), `src/components/AuthCardForm/AuthCardForm.tsx`  | Move the card shell (centred column, card, heading) out of `AuthCardForm` so the reset pages look like log-in. They can't use `AuthCardForm` itself, which redirects signed-in users and shows social sign-on. |
| Auth        | `src/auth/passwordRules.ts` (new), `src/app/(public)/(auth)/sign-up/page.tsx`     | Move `MIN_PASSWORD_LENGTH` here so sign-up and reset share it.                                                                                                                                                 |
| Links       | `src/app/(public)/(auth)/log-in/page.tsx`                                         | Add a **Reset my password** link under the password field.                                                                                                                                                     |
| Links       | `src/app/(app)/account/page.tsx` (+ `Account.module.css`)                         | Add a **Reset my password** link next to the user details.                                                                                                                                                     |
| Config/docs | `package.json`, `README.md`                                                       | Add the dependencies and an `email:dev` script. Document `RESEND_KEY`, `EMAIL_FROM` and password reset in the setup and Authentication sections.                                                               |

No database changes are needed. Reset tokens go in the existing `verification`
table (`identifier = reset-password:<token>`, expiring after 1 hour by
default).

### Decisions from the Better Auth docs and source (v1.7.x)

- **Don't block the response on the email send.** Better Auth warns that
  waiting for `sendResetPassword` before responding lets an attacker tell from
  the response time whether an account exists. Netlify Functions are
  serverless, though, so the send can't just be left running unawaited. Set
  `advanced.backgroundTasks.handler` to `(promise) => after(() => promise)`,
  using `after` from `next/server`. The Better Auth route handler runs inside
  Next's request scope, so `after` keeps the function alive until the email
  has been sent. Failed sends are logged by Better Auth, not shown to the
  user.
- **`redirectTo` must be an absolute URL** built from `window.location.origin`.
  This is the same workaround `SocialSignOn` uses: Netlify appends the query
  string to relative redirect locations. Better Auth's origin check accepts
  same-origin URLs. The link in the email is built from Better Auth's
  `baseURL`, which is the deploy's own URL in previews, so links in emails
  sent from a deploy preview go back to that preview.
- **Unknown emails get the same response.** If no account has that email,
  Better Auth returns `{ status: true }` without sending anything, so the page
  always shows the same neutral message.
- **Rate limiting.** In production, Better Auth's default rule allows 3
  `/request-password-reset` calls per 60 seconds per IP. The 60 second
  cooldown in the UI keeps users under that limit. If the limit is hit anyway
  (429), the page shows the error message.
- **Revoke sessions on reset.** Set `revokeSessionsOnPasswordReset: true` so a
  reset signs the account out everywhere, which matters if the password was
  compromised. A user who starts from the account page is sent to `/log-in`
  afterwards.
- **Google-only accounts.** If the user signed up with Google, `resetPassword`
  creates a credential account, so they can then log in with either Google or
  their email and password. This is acceptable because proving control of the
  email address is enough. Note it in the README.
- **Tokens can only be used once.** `resetPassword` uses up the token, so
  submitting again or reopening the link shows the invalid-link message.

## Implementation plan

Each commit should leave the app building and passing lint, typecheck and
prettier.

1. **Add Resend and a password reset email template**
   - Install `resend`, `react-email` and `@react-email/ui`, and add the
     `"email:dev": "email dev --dir src/email/templates"` script.
   - Add `src/email/index.ts` (Resend client from `RESEND_KEY`, `EMAIL_FROM`
     with its fallback, and `sendPasswordResetEmail`) and
     `src/email/templates/PasswordResetEmail.tsx` with `PreviewProps` so the
     preview server can render it. Use inline styles that match the app's
     colours. Don't use the app's CSS modules: email clients won't load them.
   - Document `RESEND_KEY` and `EMAIL_FROM` in the README.

2. **Enable password reset in Better Auth**
   - In `auth.ts`, set `emailAndPassword.sendResetPassword` to call
     `sendPasswordResetEmail({ to: user.email, name: user.name, url })`, and
     set `revokeSessionsOnPasswordReset: true` and
     `advanced.backgroundTasks.handler` using `after`. Update the comment.

3. **Move the auth card shell out of AuthCardForm**
   - Add `AuthCard` (heading, card styles, children). `AuthCardForm` renders
     it and keeps the redirect and social sign-on. Log-in and sign-up should
     look the same as before.
   - Move `MIN_PASSWORD_LENGTH` to `src/auth/passwordRules.ts`.

4. **Add the /password-reset request page**
   - Add the route names, the page and `RequestPasswordResetForm`. After a
     successful request, store the send time and use it to show "You can send
     another email in Ns" and disable the button until 60 seconds have
     passed. Better Auth errors (such as rate limiting) appear in the form's
     error alert.
   - Set the page's `metadata.title` to `Reset password`.

5. **Add the /password-reset/authorized page**
   - Add the page and `ResetPasswordForm`. Check in the browser that both
     passwords match before submitting. On success, `router.push` to
     `/log-in?reset=success`. On `INVALID_TOKEN`, show the expired-link
     message with a link to request another email.
   - Show a "Password updated, log in with your new password" message on
     `/log-in` when `reset=success` is set.

6. **Link to password reset from log-in and account pages**
   - Add a **Reset my password** link to the log-in form and the account page.

## Acceptance criteria

### Requesting a reset

- [ ] `/log-in` and `/account` both show a **Reset my password** link that goes
      to `/password-reset`.
- [ ] `/password-reset` is in the `(public)` route group, uses the public
      layout, and can be opened while signed in or signed out.
- [ ] When the user is signed in, the email field is filled in with their
      email.
- [ ] Submitting a registered email sends one email from Resend to that
      address, with a working **Reset password** button and the link as plain
      text.
- [ ] Submitting an unregistered email shows the same message as a registered
      one and sends nothing.
- [ ] After a send, the button stays disabled with a visible countdown for 60
      seconds, then works again and sends another email.
- [ ] If Better Auth rejects the request (e.g. it's rate limited), the error
      appears in the form's `role="alert"` message, and the page doesn't
      crash.
- [ ] The `/request-password-reset` response doesn't wait for Resend. The
      email is still sent on a Netlify deploy (sent through `after`).

### Setting a new password

- [ ] The email link opens `/password-reset/authorized?token=…` on the same
      deploy that sent it (production, a preview, or localhost).
- [ ] The form uses the shared `Form`, `TextInput` and `SubmitButton`
      components. Both fields are required and must be at least 8 characters,
      and passwords that don't match are rejected before submitting.
- [ ] A valid submission changes the password and redirects to `/log-in`,
      which shows a success message. The new password logs in, and the old
      one doesn't.
- [ ] All of the user's existing sessions are signed out after a reset.
- [ ] An expired, already-used, missing or tampered token shows an "invalid or
      expired link" message with a link back to `/password-reset`. The user
      never sees an unhandled error page.
- [ ] A Google-only user can reset a password and then log in with their email
      and password.

### Quality

- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass, and
      `npm run prettier` leaves no changes.
- [ ] `npm run email:dev` renders the password reset template.
- [ ] `RESEND_KEY` (and `EMAIL_FROM`, if used) are set in Netlify, and the
      README documents them.
- [ ] Log-in and sign-up look and work the same as before the `AuthCard`
      refactor.

## Open questions

- **Sending domain:** which verified domain and address should `EMAIL_FROM`
  use? Until a domain is verified in Resend, emails are only delivered to the
  Resend account owner's address.
- **Email verification:** with Resend set up, email verification on sign-up is now
  cheap to add. It's out of scope for this ticket.
