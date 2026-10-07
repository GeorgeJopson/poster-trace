This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local database

The app uses Netlify Database
(Postgres) through [Drizzle ORM](https://orm.drizzle.team). Run the app with
the Netlify CLI, which starts a local database alongside `next dev`:

```bash
netlify dev              # app on http://localhost:8888, plus the local database
npm run db:migrate       # first time, and after pulling new migrations
npm run db:seed          # optional: sample campaigns (see below)
```

`netlify dev` sets `NETLIFY_DB_URL` for the app, so there's no database
connection string to configure. Plain `npm run dev` has no database.

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Breakpoints

We use the following breakpoints in this project:

smallPhoneAndDown: `(max-width: calc(400 / 16 * 1rem))`

phoneAndDown: `(max-width: calc(600 / 16 * 1rem))`

tabletAndDown: `(max-width: calc(950 / 16 * 1rem))`

laptopAndDown: `(max-width: calc( 1300 / 16 * 1rem))`
