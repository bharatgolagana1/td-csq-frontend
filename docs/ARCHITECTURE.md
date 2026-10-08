# CSQ web — architecture and design system

Binding reference for everyone building the web app. The API it consumes is
specified in `../td-csq-backend/docs/ARCHITECTURE.md` §6 (same GitHub
organisation; clone it beside this repo). The product requirements are in
`../td-csq-backend/docs/REQUIREMENTS.md`.

## 1. Stack

Vite 5 · React 18 · TypeScript strict · react-router 6 (data routers) ·
@tanstack/react-query 5 · react-hook-form + zod · keycloak-js 25 ·
echarts (via echarts-for-react) · date-fns + date-fns-tz · papaparse.
Styling is **plain CSS Modules on design tokens**; no component library.
Fonts: `@fontsource/archivo`, `@fontsource/lato`, `@fontsource/ibm-plex-mono`.
Tests: vitest + @testing-library/react for components and hooks; Playwright
smoke tests for the three public/critical flows once the backend runs.

## 1a. Principles (binding)

- **Feature-driven.** `features/<area>` owns its pages, components, hooks,
  query keys and tests. Features never import from each other's internals;
  anything two features need moves to `design/` (presentation) or `lib/`
  (pure helpers) or `api/` (data).
- **Single responsibility.** A page composes; a component renders one thing;
  a hook owns one data concern; a formatter formats. Components under ~150
  lines and hooks under ~80 are the norm, not the exception. No prop drilling
  past two levels — use a feature-local context.
- **No component library.** Every primitive in `design/primitives` is ours,
  tokens-driven, accessible (keyboard, ARIA, focus), light and dark.

## 2. Layout

```
src/
  main.tsx                 fonts, tokens.css, providers, router
  app/
    router.tsx             route tree; lazy pages; `RequireTask` guards; public tree outside auth
    providers.tsx          QueryClient, Auth, Toasts, Theme
    nav.ts                 sidebar config: sections → items { label, to, icon, task }
  auth/
    keycloak.ts            instance from VITE_KEYCLOAK_*; PKCE
    session.tsx            <AuthProvider>: signs in, loads GET /me, exposes { user, org, role, tasks, memberships, switchOrg }
    RequireTask.tsx        route guard → "No access" page, never a crash
  api/
    client.ts              fetch wrapper: base URL, bearer, x-csq-org, link token, ApiError { code, message, requestId }, offline detection
    types.ts               TypeScript types mirroring the API contract (hand-written, one file per module ok)
    <module>.ts            query/mutation hooks per module (useCycles, useLockSample …) with query keys
  design/
    tokens.css             colours, type scale, spacing, radii, shadows, z-index, motion
    primitives/            Button, IconButton, Input, Select, Textarea, Checkbox, Radio, Switch,
                           Pill (status), Tag, Badge, Tooltip, Menu, Dialog, Drawer, Tabs, Stepper,
                           Table (sticky header, row actions, selection), Pagination, Toolbar,
                           SearchInput, DateTimeInput (zoned), FileDrop, Progress, Stat, Card,
                           EmptyState, Skeleton, Toast, PageHeader, Breadcrumbs, KeyValue, Avatar
    icons/                 inline SVG set (20px, 1.5 stroke)
    charts/                echarts theme bound to the tokens; Bar, Donut, Dumbbell, Sparkline, RankTable
  shell/
    AppShell.tsx           rail + topbar + content; responsive (rail → icons <1100px → drawer <760px)
    Sidebar.tsx, Topbar.tsx, OrgSwitcher.tsx, UserMenu.tsx, CycleStrip.tsx
  features/
    overview/              Super Admin landing: cycle funnel, what needs attention
    cycles/                list, wizard (CycleBuilder), detail (participants, monitoring, notifications, actions)
    airports/              master
    operators/             list, create, detail (members, market share history, customers count)
    onboarding/            links, registration requests, approval drawer with market-share total
    surveys/               survey tree editor (categories → subcategories → questions), versions, preview
    marketshare/           per airport per cycle editor with 100 % guard
    customers/             directory, add/edit drawer, bulk import (drop → validate → preview → commit)
    sampling/              cycle strip, selection table with counter, lock/unlock, audit
    selfAssessment/        operator's own return
    history/               assessments grid → read-only return
    dashboard/             operator dashboard (ACFI deck slide 8) + question table
    reports/               airport, national, comparison, exports
    users/                 users, memberships; roles + Role → Task matrix
    notifications/         log + resend
    audit/                 log
    settings/
  public/
    register/              /register/:token  onboarding form
    assess/                /assess/:token    landing → OTP → stepper form → review → done
  lib/                     formatters (dates in cycle tz, numbers to 1 dp), csv, masks
```

## 3. Design system

Light working surface; dense but calm; the ACFI rating ramp is the only colour
that carries meaning and is never a traffic light.

Tokens (`design/tokens.css`), light and dark (`prefers-color-scheme` with
`data-theme` override):

```
--bg #f6f7f8  --surface #fff  --surface-2 #f0f2f3  --ink #0c1416  --ink-2 #3b4b50
--muted #6b7d82  --line #dfe4e6  --line-2 #c3cccf  --accent #0a5c63  --accent-ink #fff
--r5 #0f7a63 (Excellent) --r4 #3f9d93 (Very good) --r3 #8aa0a3 (Good) --r2 #c8873c (Fair) --r1 #b4543c (Poor) --na #9aa7ab
--up #0f7a63 --down #b4543c --warn #b88a1e --danger #b4543c --info #2f6f8f
--font-display 'Archivo'  --font-body 'Lato'  --font-mono 'IBM Plex Mono'
--radius 6px --radius-lg 10px  --shadow-1 … --shadow-2 …
--space-1 4px … --space-8 48px   --z-drawer 40 --z-dialog 50 --z-toast 60
```

Rules:
- Headings in Archivo (`font-variation-settings: 'wdth' 110, 'wght' 700`),
  body Lato 15/22, every number and code in IBM Plex Mono with tabular figures.
- Every page starts with `PageHeader` (eyebrow · title · one-line context ·
  actions). Status is a `Pill` with text. Tables: sticky header, 44px rows,
  right-aligned numbers, row actions on hover and keyboard, selection
  checkboxes, real empty states with one primary action.
- Forms live in `Drawer` (right, 480–640px) for create/edit; multi-step work
  (cycle builder, bulk import, assessor form) uses `Stepper`.
- Focus rings always visible; all interactive targets ≥ 40px (44 on public
  pages); phone-width (390px) layouts with 16px gutters and no horizontal scroll.
- Charts: one theme, series colours from the tokens, axis in muted ink,
  numbers in mono; loading skeleton and empty state for every chart.
- Illustrative content is always marked with a `Tag` "Illustrative".

## 4. Auth and navigation

- `AuthProvider` boots keycloak (`login-required`, PKCE), then `GET /me`.
  States: `loading` (Orbis-style three-dot loader), `ready`, `no-account`
  (signed in but no CSQ account: calm page with sign-out), `error` (shows
  request id, retry). Token refreshed before expiry.
- `x-csq-org` is the selected membership (localStorage, try/catch).
  Switching organisation invalidates all queries.
- Sidebar sections (rendered only when at least one item's task is held):
  **Overview** (`monitoring.view` → /overview) · **Cycles** (`cycles.view`) ·
  **Operators** (`operators.view`) · **Airports** (`airports.view`) ·
  **Onboarding** (`onboarding.review`) · **Surveys** (`surveys.view`) ·
  **Market share** (`marketshare.view`) · **Reports** (`reports.national` |
  `reports.airport`) · **Customers** (`customers.view`) · **Sampling**
  (`sampling.view`) · **Self-assessment** (`assessments.self`) · **Dashboard**
  (`reports.operator`) · **History** (`assessments.view`) · **Users & roles**
  (`users.view`) · **Notifications** (`notifications.view`) · **Audit**
  (`audit.view`) · **Settings** (`settings.view`).
- Default route after sign-in: platform roles → /overview; operator roles →
  /dashboard; airport roles → /reports/airport.
- `CycleStrip` (operator shell, under the topbar) shows the current cycle,
  phase, deadline countdown and the sampling counter, from `GET /cycles/current`.

## 5. Data layer

- `client.ts`: `api.get/post/patch/put/delete<T>(path, { body, query, signal })`;
  throws `ApiError` (code, message, details, requestId) or `NetworkError`.
- One hooks file per module with stable query keys (`['cycles', id]`),
  mutations invalidate precisely. Lists use `keepPreviousData`. Optimistic
  updates only for the Role → Task matrix and sample selection.
- Forms: react-hook-form with zod resolvers; server `VALIDATION.details`
  mapped back onto fields.

## 6. Public assessor flow (`/assess/:token`)

A state machine: `landing` (operator, airport, cycle, closes-on, masked
e-mail, confidentiality line, "Send me a code") → `otp` (six boxes, paste,
resend with 30 s cooldown, attempts hint) → `form` (one category per step,
sticky progress "14 of 23", question cards with the six-option segmented
rating, follow-up on Fair/Poor, comment per question, autosave with
"Saved · 12:04 / Saving… / Offline — kept on this device" and a localStorage
replay queue) → `review` (missing items with jump links, Submit enabled only
when complete, confirm sheet) → `done`. `expired`, `submitted`, `revoked`
states each have a calm full-screen message. No app shell, no sign-in.

## 7. Charts (operator dashboard, ACFI deck slide 8)

Score hero (rating to 1 dp, rank of n, assessments count) · Self vs Customer
grouped bars for Overall / Current / Previous · Feedback distribution (five
bands + NA, count and %) · Category ratings with delta chips vs previous ·
Assessor stats (total / completed / in progress / yet to start, click-through)
· FF vs CB split · All-India table (airport, rating, rank; own airport
highlighted). Airport and national reports reuse the same primitives.

## 8. Implementation notes and deviations (foundation, Oct 2026)

Recorded by the foundation build so later agents know where the code departs
from the sections above and why.

- **`api.list<T>()` in addition to `api.get<T>()`.** §5 names only
  `get/post/patch/put/delete<T>`. `get<T>` returns the unwrapped `data`;
  `[list]` endpoints need `meta` too, so `api.list<T>(path, query)` returns the
  `{ data, meta }` envelope. One extra method keeps every call site typed
  without a second generic.
- **`api/selectedOrg.ts` and `api/organisations.ts`.** The `x-csq-org` accessor
  lives in `api/` (not `auth/`) so `client.ts` never imports the session. A
  minimal `useOperators` list hook exists because the invite-user drawer needs
  organisation options; the operators feature extends that file.
- **`design/hooks/`, `design/patterns/`, `design/primitives/Field`.** Not listed
  in §2. `hooks/` holds the focus-trap, scroll-lock, outside-click and
  reduced-motion hooks shared by Dialog/Drawer/Menu/charts; `patterns/` holds
  `BeingBuilt` (PageHeader + EmptyState) used by every placeholder page;
  `Field` is the label/hint/error wrapper behind Input, Select, Textarea and
  DateTimeInput.
- **Session shape.** `useSession()` exposes `{ user, org, role, tasks,
  memberships, switchOrg, signOut }` as in §2 and additionally `scope` (from
  `GET /me active.scope`) and `hasTask(code | code[])`. `role` is
  `{ code, scope }` because `/me` carries only the role code.
- **Default route uses `scope.kind`, not role codes** (§4 says "by role").
  PLATFORM → `/overview`, ACO → `/dashboard`, AIRPORT → `/reports/airport`,
  falling back to the first visible sidebar item when the preferred task is not
  held. Admin-added roles therefore work without a code list.
- **`/reports` is one sidebar entry** (per §4) that redirects to `national`
  when `reports.national` is held, else `airport`.
- **`PageHeader` publishes the title** to a tiny store (`pageTitle.ts`) that
  the Topbar mirrors; it also sets `document.title`. Pages and the shell stay
  decoupled.
- **CycleStrip is props-driven** and rendered by `AppShell` when `cycle` is
  given. `AppLayout` passes `null` until the sampling/dashboard agent wires
  `GET /cycles/current`; the dev shell shows it with sample data.
- **Route tabs in features use route-relative links** (`usersTabs.ts`) so the
  same pages mount under `/dev/design/shell/*` without knowing the prefix. The
  shell's own links resolve through `ShellContext` (`basePath`).
- **Dev gallery** (`/dev/design`, `/dev/design/shell`) is registered only when
  `import.meta.env.DEV` is true, through dynamic imports, so `src/dev/` is
  tree-shaken from production. The mocked shell patches `fetch` for the API
  base (`src/dev/mockApi.ts`).
- **SUPER_ADMIN column is locked** in the Role → Task matrix (seeded owner of
  every task, §4). The API does not forbid editing it; the UI does, to avoid
  locking the platform out.
- **Chart palette.** Series colours come from the tokens (customer = `--accent`,
  self = `--r3` grey, previous = `--line-2`). The dataviz validator flags the
  deliberately muted chroma and the grey's contrast; both are relieved by direct
  value labels and legends on every chart, which §3/§7 require anyway. The
  six-band ramp is ordinal, not categorical, and carries count + % labels.
- **Fonts.** `@fontsource-variable/archivo` (`wdth.css`, both axes) instead
  of static `@fontsource/archivo`, so `font-variation-settings: 'wdth' 110`
  works; Lato 400/700 and IBM Plex Mono 400/500 are loaded as static faces.
- **Base path (`VITE_BASE_PATH`).** Production serves the app under
  `https://dev.csq.aero/app/` beside the landing site (`/`) and the API
  (`/api/v1`). The value is Vite's `base` and the data router's `basename`
  (`lib/basePath.ts`, `app/router.tsx`); routes, `nav.ts`, `<Link>` and
  `navigate()` stay prefix-free, and only the Keycloak sign-out redirect
  builds a full URL (`appRootUrl()`). Local dev keeps `/`. The public links
  the API e-mails (`/assess/:token`, `/register/:token`,
  `/registrations/:id`) are built by the backend from `PUBLIC_WEB_URL`,
  which carries the same base path.
