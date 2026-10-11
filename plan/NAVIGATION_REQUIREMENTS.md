# Navigation Upgrade — Requirements

Refines [NAVIGATION_PLAN.md](NAVIGATION_PLAN.md) into testable requirements.
Reference mockup: [Example Navigation.png](Example%20Navigation.png).

Requirement IDs (`R-x.y`) are meant to be referenced from commits/PRs.
Items marked **[Decision]** are choices the plan left open; a recommended
default is given, and they are collected again in [§9 Open questions](#9-open-questions).

---

## 1. Background

Today `src/app/layout.tsx` (the root layout) renders one static
`<NavBar />` (logo + "Log In" / "Sign Up") and `<Footer />` around every page,
including the signed-in dashboard. Authentication is enforced by
`src/app/dashboard/layout.tsx` calling `requireUserId()`, and again by every
function in `src/data/campaigns.ts`.

Signed-in users therefore see "Log In / Sign Up" while inside the app, and
there is no way to move between campaigns, a campaign's sub-pages, the
account, or sign out.

## 2. Goals

1. Public pages keep the existing top `NavBar` and `Footer`.
2. Authenticated pages get a left-hand navigation pane (desktop) / collapsed
   rail + dialog (mobile), as shown in the mockup, and keep the existing
   `Footer`.
3. The navigation pane can display page-specific navigation, starting with a
   campaign sub-section (Create / Analytics).
4. Every page linked from the navigation exists, even if blank (§4.1).

### Non-goals

- Any content on the new Account, Register and Analytics pages — they are
  created blank (R-4.6).
- Changing the design of the public `NavBar` or `Footer`.
- Changing how authorisation is enforced in the data layer.

---

## 3. Route structure

**R-3.1** Routes are split into two route groups under `src/app/`:

| Group      | Contains                                                                    | Layout renders                                         |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `(public)` | `/` (landing), `(auth)/log-in`, `(auth)/sign-up`, `error`, `register` (new) | existing `NavBar` + `Footer`                           |
| `(app)`    | `dashboard/**`, `account` (new)                                             | new authenticated navigation shell + existing `Footer` |

**R-3.2** `src/app/layout.tsx` remains the **single** root layout (`<html>`,
`<body>`, fonts, metadata) and no longer renders `NavBar` or `Footer`.
Each group adds its own nested `layout.tsx`. Do **not** give each group its
own root layout: per the Next 16 route-group docs, navigating between
different root layouts forces a full page reload (e.g. log in → dashboard,
or dashboard → Register).

**R-3.3** Existing URLs do not change. `/`, `/log-in`, `/sign-up`, `/error`,
`/dashboard`, `/dashboard/campaign/[campaignId]` resolve exactly as today.
`api/` stays outside both groups.

**R-3.4** The existing `(auth)` group (log-in / sign-up) is nested inside
`(public)`. Its name refers to "authentication pages", not "authenticated
pages"; the new authenticated group is named `(app)` to avoid confusion.

**R-3.5** The `requireUserId()` gate moves from `dashboard/layout.tsx` to
`(app)/layout.tsx`, so every authenticated route (including `/account`) is
covered. The per-call checks in `src/data/campaigns.ts` stay — the layout
check is for redirecting, not a security boundary (see Next's
authentication guide).

**R-3.6** The `.wrapper` grid currently in `src/app/Layout.module.css`
(`auto 1fr auto` for nav / main / footer) moves to the `(public)` layout.

---

## 4. Authenticated navigation — content

**R-4.1** The navigation pane contains, top to bottom:

1. **Logo** — `logo.svg` mark, linking to `routeNames.dashboard`. In the
   mockup only the mark is shown (no "PosterTrace" wordmark), so `Logo` needs
   a mark-only variant or the pane renders the image directly.
2. **Primary links** — "Campaigns" (`/dashboard`), "Register" (`/register`).
3. **Page-specific navigation slot** (§6) — empty on most pages.
4. **Footer links**, pushed to the bottom of the pane — "Account"
   (`/account`) and "Sign Out".

**R-4.2** "Sign Out" is a button (not a link) that calls
`authClient.signOut()` and then navigates to `/` (or `routeNames.signIn`
— **[Decision]**, default `/`). While pending it is disabled.

**R-4.3** The link for the current page is marked with
`aria-current="page"` and styled as active. In the mockup the active link is
underlined. Active state is computed from `usePathname()` in a small client
component, since layouts don't re-render on navigation and cannot read the
pathname themselves.

- "Campaigns" is active on `/dashboard` only (not on campaign sub-pages,
  where the campaign sub-section shows the active item instead).

**R-4.4** All nav targets come from `routeNames`; no hard-coded paths in
navigation components. Add to `src/routeNames.ts`:

- `account: "/account"`
- `register: "/register"`
- helpers for campaign routes, e.g. `campaign(id)` and
  `campaignAnalytics(id)` (R-6.4).

### 4.1 New pages

**R-4.5** Pages linked from the navigation that don't exist yet are
created as part of this work:

| Page      | URL                                          | File                                                               | Auth required |
| --------- | -------------------------------------------- | ------------------------------------------------------------------ | ------------- |
| Account   | `/account`                                   | `src/app/(app)/account/page.tsx`                                   | Yes           |
| Analytics | `/dashboard/campaign/[campaignId]/analytics` | `src/app/(app)/dashboard/campaign/[campaignId]/analytics/page.tsx` | Yes           |
| Register  | `/register`                                  | `src/app/(public)/register/page.tsx`                               | **No**        |

**R-4.6** These pages are left **blank**: no content beyond what the
surrounding layout provides. They may export a `metadata.title`.

**R-4.7** The Register page is where posters are registered when they are
put up, so it is used by people who aren't signed in. It lives in the
`(public)` group, outside the `requireUserId()` gate, and renders with the
public `NavBar` + `Footer`. It is still linked from the authenticated
navigation; following that link moves from the `(app)` layout to the
`(public)` layout (a normal client-side navigation, per R-3.2).

**R-4.8** `/register` is a static route with no dynamic segments or
required query parameters — it does not take a poster ID in the URL.

---

## 5. Authenticated navigation — layout

### 5.1 Desktop (above the tablet breakpoint)

**R-5.1** The `(app)` layout is a CSS grid with **two columns and no
explicit rows**: one column for the navigation pane, one for the content.

```
┌────────────┬─────────────────────────────────┐
│ Logo       │ Page content                     │
│            │ (pages render as they do today,  │
│ Campaigns  │  e.g. the campaign banner at the │
│ Register   │  top of the campaign page)       │
│ ┌────────┐ │                                  │
│ │sub-nav │ │                                  │
│ └────────┘ │                                  │
│            │                                  │
│ Account    │                                  │
│ Sign Out   ├─────────────────────────────────┤
│            │ Footer                           │
└────────────┴─────────────────────────────────┘
```

**R-5.2** The navigation column has a fixed width (mockup ≈ 170px) and a
right border separating it from the content. The content column takes the
remaining space (`minmax(0, 1fr)` so wide content can't blow out the grid)
and contains the `<main>` element followed by the existing `<Footer />`,
both rendered by the `(app)` layout.

**R-5.2a** The footer sits in the content column, below `<main>`, so the
grid keeps two columns and no rows. The content column is at least the
viewport height (`min-height: 100dvh`) with `<main>` growing to fill it, so
on short pages the footer sits at the bottom of the viewport rather than
directly under the content. **[Decision]** Alternative: a full-width footer
below the whole grid; this would add a row and push the sticky nav pane up
as the footer scrolls into view. Default: footer in the content column.

**R-5.3** The navigation pane is **not** required to line up with anything
in the content column. Pages render their content (e.g. `CampaignHeader`)
unchanged inside the content column.

**R-5.4** The navigation pane uses `position: sticky; top: 0` and
`align-self: start`, with a height of the viewport (`100dvh`), so it stays
in view while the content scrolls and "Account / Sign Out" stay pinned to
the bottom of the viewport. If the pane's content is taller than the
viewport, the pane scrolls internally (`overflow-y: auto`).

**R-5.5** Inside the pane, links are laid out with flexbox
(`flex-direction: column`). The footer links group is pushed down with
`margin-top: auto`.

### 5.2 Mobile (`--tablet-and-down`)

**R-5.6** At the `--tablet-and-down` breakpoint from
`src/app/breakpoints.css` (≤ 950px), the navigation pane is replaced by a
**thin column** (≈ 48px) containing only an "expand" icon button at the
top. The grid keeps two columns; the first becomes the thin rail.

**R-5.7** The expand button opens a dialog using the existing
`src/components/Dialog` (Radix) component, containing the **same content**
as the desktop pane (logo, primary links, page-specific slot, Account,
Sign Out). Content is rendered from one shared component, not duplicated
markup.

**R-5.8** The dialog:

- has the title "Navigation" (Radix requires a title; may be visually
  hidden),
- closes when a link inside it is followed (control `open` and close on
  pathname change or on link click),
- returns focus to the expand button when closed (Radix default),
- the expand button has `aria-label="Open navigation"` and
  `aria-expanded` / `aria-controls` as provided by Radix.

**R-5.9** **[Decision]** The existing `Dialog` is a centred modal capped at
500px. Default: reuse it as-is. Alternative: add a variant that slides in
from the left as a drawer, which better matches a navigation pane.

### 5.3 Switching between layouts

**R-5.10** Both the desktop pane and the mobile rail are rendered in the
server HTML. CSS shows one and hides the other with `display: none`, using
only `@media (--tablet-and-down)`: the desktop styles are the default and
are overridden inside that query. No JavaScript viewport detection, so
there is no layout flash on load.

> Don't pair `--tablet-and-down` with `--tablet-and-up`: they are
> `max-width: 950px` and `min-width: 950px`, so at exactly 950px both match
> and both navigations would show (or both hide).

**R-5.11** Because the hidden variant uses `display: none`, only one
navigation is exposed to assistive technology at a time. Both use
`<nav aria-label="Main">` (only one is ever visible).

### 5.4 Icons

**R-5.12** New icons are taken from Feather Icons
(https://feathericons.com/), saved to `public/` as SVG, and registered in
`src/imageDetails.ts` `icons` with alt text, matching existing entries.
Needed: the expand icon (**[Decision]**: `menu` or `sidebar`; default
`menu`). Close uses the existing `x` icon.

---

## 6. Page-specific navigation

**R-6.1** The navigation pane has a slot for page-specific navigation,
rendered between the primary links and the footer links. When empty,
nothing (no empty box) is rendered.

**R-6.2** Page-specific navigation renders as a bordered, rounded sub-box
(see mockup) with:

- a **subtitle** — e.g. the campaign name — which wraps rather than
  truncating,
- a list of links, with a vertical rule on the left and the active link
  underlined (R-4.3 rules apply).

This sub-box is a reusable component (e.g. `NavSubSection`) taking
`title` and `links: { name, href }[]`.

**R-6.3** **Mechanism.** The plan says the campaign route gets its own
layout which reads the campaign name. A nested layout under `dashboard/`
cannot inject content into its parent layout's navigation column, so the
campaign layout lives in a **parallel route slot** on the `(app)` layout:

```
src/app/(app)/
  layout.tsx                       # receives { children, pageNav }
  @pageNav/
    default.tsx                    # returns null (full page loads)
    account/page.tsx               # returns null (see R-6.5)
    dashboard/page.tsx             # returns null (see R-6.5)
    dashboard/campaign/[campaignId]/
      layout.tsx                   # fetches campaign, renders NavSubSection
      page.tsx                     # returns null (Create)
      analytics/page.tsx           # returns null (Analytics)
  account/
    page.tsx
  dashboard/
    page.tsx
    campaign/[campaignId]/
      page.tsx
      analytics/page.tsx
```

The slot's campaign `layout.tsx` is the "campaign layout" from the plan; it
wraps both the Create and Analytics routes, so the sub-box shows on both.

**[Decision]** Alternative mechanisms (client context/portal set by the
page; or each leaf layout rendering the whole shell) are possible; the
parallel route is recommended because it stays server-rendered and is the
documented Next pattern.

**R-6.4** On `/dashboard/campaign/[campaignId]` and
`/dashboard/campaign/[campaignId]/analytics` the sub-box shows:

- title: the campaign's `name`,
- "Create" → `routeNames.campaign(id)` (the existing campaign page),
- "Analytics" → `routeNames.campaignAnalytics(id)` (the new blank page).

The active item follows R-4.3.

**R-6.5** The slot must clear when navigating away. Next keeps a parallel
slot's previous content on client-side navigation if the slot has no match
for the new URL, so **every page under `(app)` has a matching `@pageNav`
page**, returning `null` where there is no page-specific navigation
(`default.tsx` only covers full page loads). A root catch-all
(`@pageNav/[...rest]/page.tsx`) is not used: route groups don't appear in
the URL, so it would resolve to `/[...rest]` and could match public URLs
too. Acceptance: go to a campaign, click "Campaigns" or "Account" — the
campaign sub-box disappears.

**R-6.6** The campaign is looked up with `getMyCampaign(id)` using the same
validation as the page (`Number.isInteger`). If the ID is invalid or the
campaign is missing or not owned, the slot renders `null` rather than
calling `notFound()`; the page's own `notFound()` produces the 404. To
avoid querying twice per request (slot + page), wrap `getMyCampaign` in
React `cache()`, as `getSession` already is.

**R-6.7** After the campaign is renamed via `EditCampaignDialog`, the
sub-box title updates. The existing server action calls
`revalidatePath(`/dashboard/campaign/${campaignId}`)`; verify this
re-renders the slot too.

---

## 7. Accessibility

- **R-7.1** All navigation is reachable and operable by keyboard; focus
  styles are visible.
- **R-7.2** Active links use `aria-current="page"` (R-4.3).
- **R-7.3** The page-specific sub-box is a labelled group (e.g. a nested
  list under a heading or `aria-labelledby` the title), so screen readers
  announce "Grand Opening Of Cafe" before "Create / Analytics".
- **R-7.4** Mobile dialog follows R-5.8.
- **R-7.5** Animations (e.g. dialog) respect `prefers-reduced-motion`
  (`usePrefersReducedMotion` already exists).

## 8. Acceptance criteria

1. `/`, `/log-in`, `/sign-up`, `/error` look exactly as before (NavBar +
   Footer).
2. Signed-out request to any `/dashboard/**` URL or `/account` redirects to
   `/log-in`.
3. Signed-out request to `/register` shows a blank page with the public
   NavBar + Footer (no redirect).
4. On `/dashboard` (wide viewport): left pane with logo, Campaigns (active),
   Register, Account and Sign Out; no sub-box; no public NavBar; the
   existing Footer below the content in the content column.
5. On `/dashboard/campaign/1`: sub-box titled with the campaign name,
   "Create" active. On `/dashboard/campaign/1/analytics`: same sub-box,
   "Analytics" active, blank content.
6. Scrolling a long campaign page keeps the pane fixed, with Account /
   Sign Out at the bottom of the viewport.
7. Navigating campaign → Campaigns removes the sub-box without a reload.
8. Navigating log in → dashboard, or dashboard → Register, does not trigger
   a full page reload.
9. At ≤ 950px: thin rail with an expand button; the button opens a dialog
   with the same links; following a link closes it; Escape closes it and
   returns focus. At > 950px only the full pane shows (including exactly
   950/951px — no width where both or neither show).
10. Sign Out ends the session and lands on the public site.
11. `npm run lint` / type-check / build pass.

## 9. Open questions

| #   | Question                                                                                                        | Default if unanswered                 |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | Mobile dialog: reuse centred modal or add a left drawer? (R-5.9)                                                | Reuse existing `Dialog`               |
| 2   | Expand icon (R-5.12)                                                                                            | Feather `menu`                        |
| 3   | Where does Sign Out land? (R-4.2)                                                                               | `/`                                   |
| 4   | Footer placement on authenticated pages (R-5.2a)                                                                | In the content column, below `<main>` |
| 5   | Page-specific nav mechanism (R-6.3)                                                                             | `@pageNav` parallel route             |
| 6   | Should a signed-in user visiting `/` see the public NavBar, or get "Dashboard" in place of "Log In / Sign Up"?  | Unchanged (out of scope)              |
| 7   | The footer's "Log In" / "Sign Up" links also show to signed-in users. Hide or swap them on authenticated pages? | Unchanged (out of scope)              |

### Resolved

| Question                                            | Answer                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| What is "Register"?                                 | Where posters are registered when put up; public, no sign-in (R-4.7) |
| Ship links to pages that don't exist yet?           | Yes; create the pages blank (R-4.5, R-4.6)                           |
| Mobile breakpoint                                   | `--tablet-and-down` (R-5.6)                                          |
| Should the nav pane line up with a page header row? | No; two columns, no rows (R-5.1, R-5.3)                              |
| Does `/register` need a poster ID in the URL?       | No (R-4.8)                                                           |
| Should authenticated pages keep a footer?           | Yes (R-5.2, R-5.2a)                                                  |
