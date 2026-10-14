# Poster Trace

A [Next.js](https://nextjs.org) app using Netlify Database (Postgres) through
[Drizzle ORM](https://orm.drizzle.team), with email/password and Google sign-in via
[Better Auth](https://www.better-auth.com).

## Setting up a development server

1. Install [Node.js 24](https://nodejs.org) and the Netlify CLI (v26 or
   later), then log in:

   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```
   BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=<any long random string, e.g. from `openssl rand -base64 32`>
   GOOGLE_CLIENT_ID=<Google OAuth client ID>
   GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
   RESEND_KEY=<Resend API key>
   EMAIL_FROM=<optional sender, e.g. Poster Trace <noreply@example.com>>
   ```

   The Google OAuth client must list
   `http://localhost:3000/api/auth/callback/google` as an authorised redirect
   URI. Don't set `NETLIFY_DB_URL`: `netlify dev` provides it. See
   [Email](#email) for `RESEND_KEY` and `EMAIL_FROM`.

4. Start the dev server, which also starts a local database:

   ```bash
   netlify dev
   ```

5. In a second terminal, create the tables and (optionally) add sample data:

   ```bash
   npm run db:migrate
   npm run seed
   ```

6. Open [http://localhost:3000](http://localhost:3000) and log in. If you
   seeded the database, log in as `test@example.com` with password
   `password123` to see the sample campaigns on `/dashboard`.

`netlify dev` serves the app on port 3000 and runs Next.js on 3001 behind it
(see `[dev]` in `netlify.toml`). Use `netlify dev`, not `npm run dev`: plain
`next dev` has no database. Local data persists between runs; re-run
`npm run db:migrate` after pulling new migrations.

## Local database

`netlify dev` runs a local Postgres database and sets `NETLIFY_DB_URL` for
the app, so there's no connection string to configure.

The schema lives in `src/db/schema.ts`. After changing it, generate a
migration and apply it locally:

```bash
npm run db:generate      # writes netlify/database/migrations/<timestamp>_<name>/
npm run db:migrate
```

Commit the generated migration; Netlify applies it on deploy. Never edit or
delete a migration that has been deployed, and never run `drizzle-kit push`
or `drizzle-kit migrate` against a Netlify-hosted database.

`npm run db:reset` wipes the local database and re-applies every migration.

## Authentication

Users sign up at `/sign-up` and log in at `/sign-in`, with either an email
and password or Google OAuth. Signing in with Google for the first time
creates the account, so both pages offer it. There's no email verification
yet. Poster campaigns are owned by the user who created them, so `/dashboard`
always requires signing in.

Users can reset their password from `/password-reset`, linked from the log-in
and account pages. Better Auth emails a link (sent with Resend, see
[Email](#email)) that works once and expires after 1 hour. It leads to
`/password-reset/authorized`, where the user chooses a new password. A reset
signs the account out everywhere. If the account only used Google before, the
reset adds an email and password login, so the user can log in either way.

`npm run seed` assigns its campaigns to the test account `test@example.com`
(password `password123`), creating it if needed and resetting its password.

## Email

Emails are sent with [Resend](https://resend.com) from `src/email/`, using
templates built with [React Email](https://react.email) in
`src/email/templates/`.

- `RESEND_KEY` is the Resend API key.
- `EMAIL_FROM` is the sender address, e.g.
  `Poster Trace <noreply@<verified-domain>>`. If it isn't set, emails come from
  `Poster Trace <onboarding@resend.dev>`, which Resend only delivers to the
  Resend account's own address.

To preview the templates in a browser, run:

```bash
npm run email:dev
```

## Deployment

The site is hosted on Netlify (configured in `netlify.toml`). Netlify detects
Next.js and applies its adapter automatically. Netlify Database is provisioned
automatically and applies pending migrations from
`netlify/database/migrations/` on every deploy. Deploy previews get their own
database branch, copied from production when the preview is created. Because
that copy includes production data, don't share preview links publicly.

Set these environment variables in the Netlify UI (Site configuration →
Environment variables), scoped to the Builds and Functions:

- `BETTER_AUTH_URL` — public site URL, e.g. `https://www.postertrace.app`
- `BETTER_AUTH_SECRET` — random secret for signing sessions
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `RESEND_KEY` — Resend API key, in every deploy context
- `EMAIL_FROM` — sender address on a domain verified in Resend (optional,
  see [Email](#email))

The Google OAuth client must list
`<BETTER_AUTH_URL>/api/auth/callback/google` as an authorised redirect URI.

Google doesn't allow wildcard redirect URIs, so deploy previews and branch
deploys sign in through production using Better Auth's OAuth proxy plugin
(see `src/auth/auth.ts`). For this to work, `BETTER_AUTH_URL` must be the
production URL in every context, and `BETTER_AUTH_SECRET` must be the same in
production and previews.

## Breakpoints

We use the following breakpoints in this project:

smallPhoneAndDown: `(max-width: calc(400 / 16 * 1rem))`

phoneAndDown: `(max-width: calc(600 / 16 * 1rem))`

tabletAndDown: `(max-width: calc(950 / 16 * 1rem))`

laptopAndDown: `(max-width: calc( 1300 / 16 * 1rem))`
