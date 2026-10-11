# Navigation Upgrade — Implementation Plan

Splits [NAVIGATION_REQUIREMENTS.md](NAVIGATION_REQUIREMENTS.md) into a
sequence of commits. Each commit leaves the app building and working, so the
branch can be reviewed (or bisected) commit by commit.

References: `R-x.y` = requirement, `AC n` = acceptance criterion (§8 of the
requirements).

---

## How every commit is checked

There is no automated test suite in the repo, so each commit is checked by:

1. **Static checks** — all three must pass before committing:

   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

   `next build` prints the route table; use it to confirm which URLs exist
   and that existing URLs are unchanged.

2. **Manual checks in the running app** (`netlify dev`, http://localhost:3000),
   listed per commit below. Use a seeded user with at least one campaign
   (`npm run seed`) and, for scroll checks, a campaign with enough poster
   designs to scroll.

Two techniques used repeatedly below:

- **Full-reload detector.** In the browser console run
  `window.__noReload = true`, then click a link. If
  `window.__noReload` is still `true` afterwards, the navigation was
  client-side; if it's `undefined`, the page fully reloaded.
- **Signed-out check.** Use a private window (no session cookie).

---

## Commit 1 — Route helpers in `routeNames`

**Requirements:** R-4.4

**Plan**

- In `src/routeNames.ts` add:
  - `account: "/account"`, `register: "/register"`,
  - `campaign: (id: number) => \`/dashboard/campaign/${id}\``,
  - `campaignAnalytics: (id: number) => \`/dashboard/campaign/${id}/analytics\``.
Keep `as const`on the static entries (the object can stay`as const`;
    functions are fine inside it).
- Replace the existing hard-coded campaign URLs with the helpers:
  - `src/app/dashboard/_components/CampaignCard/CampaignCard.tsx` (`href`),
  - `src/app/dashboard/_components/CreateCampaignDialog/actions.ts`
    (`redirect`),
  - `src/app/dashboard/campaign/[campaignId]/actions.ts` (both
    `revalidatePath` calls).

No behaviour change.

**Check**

- Static checks pass.
- `grep -rn "/dashboard/campaign/" src` only matches `src/routeNames.ts`.
- Manual: clicking a campaign card opens the campaign; creating a campaign
  redirects to it; editing a campaign's name updates the header.

---

## Commit 2 — Split routes into `(public)` and `(app)` groups

**Requirements:** R-3.1 – R-3.6

Structural move only. To keep this commit free of visual changes, the
`(app)` layout **temporarily** renders the same `NavBar` + `Footer` as
`(public)`; Commit 4 replaces it with the new shell.

**Plan**

- Use `git mv` throughout so history follows the files.
- Create `src/app/(public)/`:
  - `git mv src/app/page.tsx src/app/(public)/page.tsx`
  - `git mv src/app/(auth) src/app/(public)/(auth)`
  - `git mv src/app/error src/app/(public)/error`
  - `git mv src/app/Layout.module.css src/app/(public)/PublicLayout.module.css`
  - New `src/app/(public)/layout.tsx`: renders
    `<div className={styles.wrapper}><NavBar /><main>{children}</main><Footer /></div>`
    (exactly what the root layout does today).
- `src/app/_components/` (landing-page sections) stays where it is; its
  `@/app/_components/...` imports keep working.
- Root `src/app/layout.tsx`: remove `NavBar`, `Footer`, the wrapper div and
  the CSS module import. `<body>` renders `{children}` directly. Fonts and
  metadata are unchanged.
- Create `src/app/(app)/`:
  - `git mv src/app/dashboard src/app/(app)/dashboard`
  - `git rm src/app/(app)/dashboard/layout.tsx` and create
    `src/app/(app)/layout.tsx` that calls `await requireUserId()` and, for
    now, renders the same markup as the `(public)` layout (it can import
    the same CSS module, or duplicate it — it is deleted in Commit 4).
- Fix absolute imports that contain the old path. These break on the move:
  - `(app)/dashboard/campaign/[campaignId]/actions.ts`
  - `(app)/dashboard/campaign/[campaignId]/_components/CreatePosterDesignDialog/CreatePosterDesignDialog.tsx`
    (two imports)

  Change `@/app/dashboard/...` → `@/app/(app)/dashboard/...`, or to
  relative imports to match the rest of the folder. Re-run
  `grep -rn "@/app/dashboard" src` to confirm none remain.

- `error/page.tsx` uses `PageProps<"/error">`; the URL is unchanged so the
  type keeps working, but confirm with `typecheck`.

**Check**

- Static checks pass. Route table lists `/`, `/log-in`, `/sign-up`,
  `/error`, `/dashboard`, `/dashboard/campaign/[campaignId]` — same as
  before (R-3.3).
- **AC 1:** `/`, `/log-in`, `/sign-up`, `/error` look identical to `main`
  (compare side by side).
- **AC 2:** signed out, `/dashboard` and `/dashboard/campaign/1` redirect to
  `/log-in`.
- **AC 8 (first half):** log in with the full-reload detector set → land on
  `/dashboard` with `window.__noReload === true`.
- Dashboard and campaign pages look and behave exactly as before.

---

## Commit 3 — Blank Account, Register and Analytics pages

**Requirements:** R-4.5 – R-4.8

**Plan**

- `src/app/(app)/account/page.tsx` — exports
  `metadata = { title: "Account" }`, renders nothing (`return null`).
- `src/app/(public)/register/page.tsx` — `metadata = { title: "Register" }`,
  renders nothing. No dynamic segments, no `searchParams` (R-4.8).
- `src/app/(app)/dashboard/campaign/[campaignId]/analytics/page.tsx` —
  `metadata = { title: "Analytics" }`. Validates the campaign the same way
  the campaign page does (`Number.isInteger`, `getMyCampaign`,
  `notFound()`) so unknown or other users' campaigns 404, then renders
  nothing. (Content is blank; the validation is not content.)

**Check**

- Static checks pass; route table now also lists `/account`, `/register`,
  `/dashboard/campaign/[campaignId]/analytics`.
- **AC 2:** signed out, `/account` and `/dashboard/campaign/1/analytics`
  redirect to `/log-in`.
- **AC 3:** signed out, `/register` renders with the public NavBar + Footer
  and an empty main area; no redirect.
- Signed in: `/dashboard/campaign/<your id>/analytics` renders (blank);
  `/dashboard/campaign/999999/analytics` and `.../abc/analytics` 404.
- Tab titles read "Account · PosterTrace", etc.

---

## Commit 4 — Authenticated navigation shell (desktop)

**Requirements:** R-4.1 – R-4.3, R-5.1 – R-5.5, R-7.1, R-7.2

**Plan**

New components in `src/components/AppNav/` (one folder per component,
following the existing `Component/Component.tsx` + `index.ts` +
`*.module.css` pattern):

- **`NavLink`** (client) — wraps `next/link`; reads `usePathname()`;
  sets `aria-current="page"` and an active class (underline) when
  `pathname === href`. Exact match only, so "Campaigns" is not active on
  campaign sub-pages (R-4.3).
- **`SignOutButton`** (client) — `<button>` that calls
  `authClient.signOut()`, then `router.push("/")` and `router.refresh()`.
  Disabled while pending (`useTransition`), R-4.2.
- **`NavPane`** (server) — the pane's content, laid out with flexbox
  column (R-5.5):
  1. logo mark linking to `routeNames.dashboard` — add a `showTitle`
     (default `true`) prop to `Logo`, or render `icons.logo` directly
     (R-4.1),
  2. `NavLink`s: Campaigns, Register,
  3. a `pageNav` prop rendered here (unused until Commit 5),
  4. a footer group with `margin-top: auto`: Account `NavLink`,
     `SignOutButton`.

  Wrapped in `<nav aria-label="Main">`.

`src/app/(app)/layout.tsx` + `AppLayout.module.css`:

- Replace the temporary NavBar/Footer markup with:

  ```tsx
  <div className={styles.grid}>
    <aside className={styles.navColumn}>
      <NavPane />
    </aside>
    <div className={styles.contentColumn}>
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  </div>
  ```

- CSS:
  - `.grid { display: grid; grid-template-columns: 170px minmax(0, 1fr); }`
    — two columns, no rows (R-5.1, R-5.2).
  - `.navColumn` — right border (`--color-green-800`, matching `NavBar`).
  - Pane: `position: sticky; top: 0; align-self: start; height: 100dvh;
overflow-y: auto;` (R-5.4).
  - `.contentColumn { display: flex; flex-direction: column;
min-height: 100dvh; }`, `.main { flex: 1; }` — footer at the bottom
    on short pages (R-5.2a).
- Remove the temporary CSS from Commit 2.

**Check**

- Static checks pass.
- **AC 4:** on `/dashboard` at a wide viewport (≥ 1200px): pane with logo,
  Campaigns (underlined), Register, Account, Sign Out; no top NavBar;
  Footer below the content in the right-hand column.
- Inspect the "Campaigns" link: `aria-current="page"` on `/dashboard`;
  absent on `/dashboard/campaign/1` and `/account`. "Account" is active on
  `/account`.
- **AC 6:** on a campaign with many poster designs, scroll to the bottom:
  the pane stays put, Account / Sign Out stay at the bottom of the
  viewport. Shrink the window height below the pane's content height: the
  pane scrolls on its own.
- Short page (`/account`): the footer sits at the bottom of the viewport,
  not directly under the (empty) content.
- **AC 8 (second half):** from `/dashboard`, click Register with the
  full-reload detector set → `/register` loads with the public layout and
  `window.__noReload === true`.
- **AC 10:** Sign Out → lands on `/`; visiting `/dashboard` then redirects
  to `/log-in`. Button is disabled while signing out.
- **R-7.1:** tab through the pane — every link and the button receives a
  visible focus ring, in order.

---

## Commit 5 — Campaign sub-navigation via `@pageNav`

**Requirements:** R-6.1 – R-6.7, R-7.3

**Plan**

- **`NavSubSection`** (server) in `src/components/AppNav/` — props
  `title: string`, `links: { name: string; href: string }[]`. Bordered,
  rounded box; title wraps (`overflow-wrap: anywhere`); links in a `<ul>`
  with a left border, each rendered with `NavLink` so the active link is
  underlined. Labelled group: `<section aria-labelledby={titleId}>` with
  the title as the heading (R-7.3).
- **`getMyCampaign`** in `src/data/campaigns.ts` — wrap in React `cache()`
  (as `getSession` is) so the slot and page share one query per request
  (R-6.6).
- **Slot files** under `src/app/(app)/@pageNav/`:

  ```
  default.tsx                                 # return null
  account/page.tsx                            # return null
  dashboard/page.tsx                          # return null
  dashboard/campaign/[campaignId]/layout.tsx  # NavSubSection
  dashboard/campaign/[campaignId]/page.tsx    # return null
  dashboard/campaign/[campaignId]/analytics/page.tsx  # return null
  ```

  The campaign `layout.tsx` reads `params.campaignId`, validates it, calls
  `getMyCampaign`, and renders `NavSubSection` with the campaign name and
  links to `routeNames.campaign(id)` ("Create") and
  `routeNames.campaignAnalytics(id)` ("Analytics"), followed by
  `{children}` (which is `null`).

- `(app)/layout.tsx` takes `{ children, pageNav }` (type with
  `LayoutProps<"/">` or explicit props) and passes `pageNav` to `NavPane`.

> **Deviation from R-6.3 / R-6.5 — needs a requirements update.** The
> requirements suggest a root catch-all `@pageNav/[...rest]/page.tsx`.
> Because route groups don't appear in the URL, that slot route would
> resolve to `/[...rest]` and could match _every_ URL, including public
> ones (`/register`, unknown URLs), with unclear interaction with the
> `(public)` routes and the `requireUserId()` gate. Instead, give every
> `(app)` route an explicit slot page returning `null` (`account`,
> `dashboard` above). Rule for future routes: **any new page under `(app)`
> needs a matching `@pageNav` page**, otherwise the previous sub-box sticks
> after client-side navigation. `default.tsx` still covers hard loads.
> Verify this in the first step of the commit (see checks) before building
> the rest.

> **Invalid campaign IDs.** If the slot layout calls `notFound()`, the 404
> is raised from inside the slot. Prefer: the slot layout **returns
> `null`** when the ID is invalid or the campaign isn't found, and the
> page's own `notFound()` produces the 404 as it does today. (Differs from
> R-6.6's wording; same outcome for the user.)

**Check**

- Static checks pass.
- **Spike first:** with only `default.tsx`, `dashboard/page.tsx` and a
  placeholder campaign layout ("SUBNAV"), confirm: campaign → Campaigns
  (client-side) removes "SUBNAV"; refreshing on `/dashboard` shows no
  "SUBNAV"; `/register` and `/log-in` are unaffected.
- **AC 5:** `/dashboard/campaign/<id>`: sub-box titled with the campaign
  name, "Create" underlined with `aria-current="page"`. Click "Analytics":
  same sub-box, "Analytics" active, blank content.
- **AC 7:** campaign → Campaigns removes the sub-box, with
  `window.__noReload === true`. Also campaign → Account, and hard refresh
  on each of `/dashboard`, `/account`, campaign, analytics.
- Long campaign name wraps inside the box, no overflow.
- **R-6.7:** rename the campaign via the settings dialog → sub-box title
  updates without a manual refresh.
- `/dashboard/campaign/999999` and `/dashboard/campaign/abc`: 404 page,
  no sub-box, no server error in the terminal.
- Terminal / server logs: one campaign query per request on the campaign
  page (confirms `cache()`), if query logging is available.
- Screen reader (VoiceOver: VO+U → landmarks / headings): the sub-box is
  announced with the campaign name before its links (R-7.3).

---

## Commit 6 — Mobile navigation rail and dialog

**Requirements:** R-5.6 – R-5.12, R-7.4, R-7.5

**Plan**

- **Icon:** download Feather `menu` SVG to `public/menu.svg` (same stroke
  settings as the existing Feather icons, e.g. compare with
  `public/x.svg`); add `menu: { src: "/menu.svg", alt: "Menu icon" }` to
  `icons` in `src/imageDetails.ts` (R-5.12).
- **`MobileNav`** (client) in `src/components/AppNav/` — receives the
  pane content as `children` (a server-rendered `NavPane` passed from the
  layout, so content isn't duplicated — R-5.7):
  - controlled `open` state,
  - `Dialog` with `title="Navigation"` and trigger
    `<button aria-label="Open navigation"><Image src={icons.menu.src} … /></button>`,
  - closes on link click: wrap `children` in a `<div onClick>` that calls
    `setOpen(false)` when `event.target.closest("a")` — this also covers
    links inside the server-rendered `@pageNav` content, which can't take
    an `onNavigate` prop. Avoid closing via a `useEffect` on pathname
    (the React-hooks lint rules flag `setState` in effects).
- `(app)/layout.tsx`: render both, in the nav column:

  ```tsx
  <aside className={styles.navColumn}>
    <div className={styles.desktopNav}>
      <NavPane pageNav={pageNav} />
    </div>
    <div className={styles.mobileNav}>
      <MobileNav>
        <NavPane pageNav={pageNav} />
      </MobileNav>
    </div>
  </aside>
  ```

  `pageNav` is a React node, so rendering it twice is fine (they're
  never both visible).

- CSS — only `--tablet-and-down`, desktop as default (R-5.10):

  ```css
  .mobileNav {
    display: none;
  }

  @media (--tablet-and-down) {
    .grid {
      grid-template-columns: 48px minmax(0, 1fr);
    }
    .desktopNav {
      display: none;
    }
    .mobileNav {
      display: block;
      position: sticky;
      top: 0;
    }
  }
  ```

- **R-5.9 / R-7.5:** reuse the existing `Dialog` unchanged (default
  decision). Its animations aren't currently gated on reduced motion;
  if needed, add a `@media (prefers-reduced-motion: reduce)` override in
  `Dialog.module.css` that removes the keyframe animations.
- Both copies of `NavPane` render `<nav aria-label="Main">`; the hidden one
  is `display: none` so only one is exposed (R-5.11). Inside the dialog
  the logo and links are the same as the desktop pane.

**Check**

- Static checks pass.
- **AC 9**, using DevTools device toolbar (responsive mode):
  - 951px wide: full pane only, no rail.
  - 950px wide: rail with menu button only, no pane. (Confirms no width
    shows both or neither.)
  - 375px wide: rail; content fills the rest without horizontal scroll.
- Open the dialog: same logo, links, campaign sub-box (on a campaign page),
  Account, Sign Out. Click "Campaigns" → navigates and the dialog closes.
  Click a sub-box link → closes. Escape → closes and focus returns to the
  menu button. Tab is trapped inside the dialog while open.
- Accessibility tree (DevTools → Accessibility): only one "Main" `nav`
  landmark at each width; the menu button has name "Open navigation" and
  `aria-expanded` toggles.
- Load a page at 600px width with JS disabled / throttled: the rail is
  shown from the first paint, no flash of the desktop pane (R-5.10).
- macOS "Reduce motion" on: dialog opens without animation (if the
  override was added).

---

## Acceptance criteria → commit map

| AC  | Summary                                     | Verified in       |
| --- | ------------------------------------------- | ----------------- |
| 1   | Public pages unchanged                      | 2 (re-check at 6) |
| 2   | Signed-out redirects for `(app)` routes     | 2, 3              |
| 3   | `/register` public and blank                | 3                 |
| 4   | Dashboard pane, footer in content column    | 4                 |
| 5   | Campaign sub-box on Create and Analytics    | 5                 |
| 6   | Pane stays fixed while scrolling            | 4                 |
| 7   | Sub-box clears on navigation, no reload     | 5                 |
| 8   | No full reloads between groups              | 2, 4              |
| 9   | Mobile rail + dialog at `--tablet-and-down` | 6                 |
| 10  | Sign Out                                    | 4                 |
| 11  | Lint / typecheck / build                    | every commit      |

After Commit 6, run through all of §8 once more end to end on a fresh
`netlify dev` before opening the PR.

## Follow-up to the requirements doc

Update NAVIGATION_REQUIREMENTS.md R-6.3, R-6.5 and R-6.6 to match the two
deviations noted in Commit 5 (explicit `null` slot pages instead of a root
catch-all; slot returns `null` rather than calling `notFound()`), once the
spike confirms them.
