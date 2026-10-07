# Poster Trace

A [Next.js](https://nextjs.org) app using Netlify Database (Postgres) through
[Drizzle ORM](https://orm.drizzle.team), with Google sign-in via
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
   SEED_USER_EMAIL=<your Google email, used by the seed script>
   ```

   The Google OAuth client must list
   `http://localhost:3000/api/auth/callback/google` as an authorised redirect
   URI. Don't set `NETLIFY_DB_URL`: `netlify dev` provides it.

4. Start the dev server, which also starts a local database:

   ```bash
   netlify dev
   ```

5. In a second terminal, create the tables and (optionally) add sample data:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. Open [http://localhost:3000](http://localhost:3000) and sign in with
   Google. If you seeded with your email, the sample campaigns appear on
   `/dashboard`.

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

Sign-in is Google OAuth only. Poster campaigns are owned by the user who
created them, so `/dashboard` always requires signing in.

`npm run db:seed` assigns its campaigns to the user with the email in
`SEED_USER_EMAIL` (creating that user if needed). Set it to your Google
email to see the seed data after signing in.

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

The Google OAuth client must list
`<BETTER_AUTH_URL>/api/auth/callback/google` as an authorised redirect URI.

Google doesn't allow wildcard redirect URIs, so deploy previews and branch
deploys sign in through production using Better Auth's OAuth proxy plugin
(see `src/lib/auth.ts`). For this to work, `BETTER_AUTH_URL` must be the
production URL in every context, and `BETTER_AUTH_SECRET` must be the same in
production and previews.

## Breakpoints

We use the following breakpoints in this project:

smallPhoneAndDown: `(max-width: calc(400 / 16 * 1rem))`

phoneAndDown: `(max-width: calc(600 / 16 * 1rem))`

tabletAndDown: `(max-width: calc(950 / 16 * 1rem))`

laptopAndDown: `(max-width: calc( 1300 / 16 * 1rem))`
