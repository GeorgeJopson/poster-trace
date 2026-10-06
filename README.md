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

Postgres runs locally via Docker Compose:

```bash
npm run db:up            # start Postgres (localhost:5432)
npx prisma migrate deploy # first time only: create the tables
npm run dev
```

`DATABASE_URL` in `.env` should be:

```
postgresql://poster_trace:poster_trace@localhost:5432/poster_trace
```

Other scripts: `npm run db:down` (stop, keeps data), `npm run db:reset` (wipe volume, restart, re-apply migrations).

## Authentication

Sign-in is Google OAuth only. Poster campaigns are owned by the user who
created them, so `/dashboard` always requires signing in.

`npx prisma db seed` assigns its campaigns to the user with the email in
`SEED_USER_EMAIL` (creating that user if needed). Set it to your Google
email to see the seed data after signing in.

## Deployment

The site is hosted on Netlify (configured in `netlify.toml`). Netlify detects
Next.js and applies its adapter automatically. Every build runs
`prisma migrate deploy` before `next build`, so deploy previews and branch
deploys need their own `DATABASE_URL`, pointing at a separate database from
production.

Set these environment variables in the Netlify UI (Site configuration →
Environment variables), scoped to the Builds and Functions:

- `DATABASE_URL` — Postgres connection string (needed at build time for
  migrations and at runtime)
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
