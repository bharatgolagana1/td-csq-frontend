# CSQ web

The web app for the Cargo Service Quality survey platform. Architecture and
design system: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (binding). API
contract: `../td-csq-backend/docs/ARCHITECTURE.md` §6.

`landing/` is the static marketing site. In production both live on one
host: the landing at `https://dev.csq.aero/`, this app at
`https://dev.csq.aero/app/` and the API at `https://dev.csq.aero/api/v1`
(`../td-csq-backend/deploy/README.md`).

## Run

```
npm install
cp .env.example .env      # already done on a fresh checkout if .env exists
npm run dev               # http://localhost:5173
```

Scripts: `dev` · `build` (typecheck + Vite build) · `preview` · `lint` (ESLint 9,
typescript-eslint strict, react-hooks, jsx-a11y) · `typecheck` · `test` (vitest +
Testing Library, jsdom) · `test:watch`.

Node ≥ 22 (26 on the dev machine), npm.

## Environment

| Variable                  | Example                          |
| ------------------------- | -------------------------------- |
| `VITE_KEYCLOAK_URL`       | `https://auth.tinydata.in/`      |
| `VITE_KEYCLOAK_REALM`     | `csq`                            |
| `VITE_KEYCLOAK_CLIENT_ID` | `csq-frontend`                   |
| `VITE_API_BASE_URL`       | `http://localhost:4000/api/v1`   |
| `VITE_BASE_PATH`          | `/` (local) · `/app/` (image)    |

`.env.example` is committed; `.env` is local.

`VITE_BASE_PATH` is the public path the bundle is served under. It becomes
Vite's `base` (asset URLs, `import.meta.env.BASE_URL`) and the data router's
`basename` (`src/app/router.tsx`, via `src/lib/basePath.ts`), so pages keep
writing `<Link to="/cycles">` and `navigate('/')` and never mention it; the
only code that builds a full URL is the Keycloak sign-out redirect. Leave it
at `/` for `npm run dev`. The Dockerfile builds with `/app/` (the host nginx
keeps `/` for the landing site and `/api/` for the API) and its
`deploy/nginx/nginx.conf` serves exactly that path. To try the base path
locally, `VITE_BASE_PATH=/app/ npm run dev` and open
http://localhost:5173/app/ (the gallery is then at `/app/dev/design`).

## The design gallery (dev only)

Keycloak is not required to review the UI. With `npm run dev` open:

- **http://localhost:5173/dev/design** — every primitive in every state, the
  icon set, tokens and type, the charts with sample data. Theme toggle in the
  left index.
- **http://localhost:5173/dev/design/shell** — the full `AppShell` with a
  mocked session and a mocked API (`src/dev/mockApi.ts` intercepts `fetch` for
  the API base). The dark bar at the top switches between the three role
  presets (platform · operator · airport), which changes the sidebar, the
  default route and the cycle strip. Every real feature page renders here,
  including **Users & roles** (`/dev/design/shell/users`) and the **Role → Task
  matrix** (`/dev/design/shell/users/roles`). Removing `reports.operator` from
  ACO_USER and saving demonstrates the error toast with a request id.

The `/dev/design` routes are registered only when `import.meta.env.DEV` is
true and are loaded with dynamic imports, so nothing under `src/dev/` reaches
the production bundle.

## Layout

```
src/
  main.tsx            fonts, tokens, providers, router
  app/                router.tsx (data router, lazy pages, RequireTask guards), nav.ts, providers.tsx, theme.tsx
  auth/               keycloak.ts, session.tsx (AuthProvider, useSession), RequireTask.tsx
  api/                client.ts, types.ts, identity.ts, settings.ts, organisations.ts
  design/             tokens.css, base.css, primitives/, icons/, charts/, hooks/, patterns/
  shell/              AppShell, Sidebar, Topbar, OrgSwitcher, UserMenu, CycleStrip
  features/<area>/    one folder per sidebar area; pages are the default export
  public/             /register/:token and /assess/:token (no shell, no sign-in)
  dev/                design gallery and mocks (dev only)
  lib/                formatters, cn, formErrors
```

## Adding a feature

1. Create `src/features/<area>/<Name>Page.tsx` with a default export. Start
   the page with `PageHeader` and use primitives from `@/design/primitives`;
   never import another feature's internals (shared presentation goes to
   `design/`, pure helpers to `lib/`, data to `api/`).
2. Add the hooks file `src/api/<module>.ts`: stable query keys
   (`['cycles', id]`), `useQuery`/`useMutation` wrappers around `api.*`, precise
   invalidation. Lists use `api.list` + `keepPreviousData`.
3. Register the route in `src/app/router.tsx` inside `appChildren`, wrapped in
   `guarded('<task>', …)`; the sidebar entry in `src/app/nav.ts` carries the
   same task. Placeholder pages already exist for every §4 route — replace
   the file in place.
4. Forms: react-hook-form + zod (`zodResolver`), server `VALIDATION.details`
   mapped with `applyServerErrors` from `@/lib/formErrors`. Create/edit lives in
   a `Drawer`; multi-step work in a `Stepper`.
5. Errors: `useToast().error(message, { requestId })` for mutations; an
   `EmptyState` with retry for failed queries.
6. Tests next to the code (`*.test.tsx`). Check the result in
   `/dev/design/shell` — extend `src/dev/mockApi.ts` with the routes the page
   needs so it is reviewable without the backend.

Run `npm run typecheck && npm run lint && npm test && npm run build` before
opening a PR.
