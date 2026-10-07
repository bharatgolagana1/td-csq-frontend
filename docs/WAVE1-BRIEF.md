# Wave 1 brief — feature areas

Read `docs/ARCHITECTURE.md` (binding), the backend contract
`../td-csq-backend/docs/ARCHITECTURE.md` §6 and `docs/REQUIREMENTS.md`
there. Several agents work concurrently on disjoint folders; never edit
outside your ownership, never commit.

## 0. What already exists (Wave 0)

- `src/design/**` — tokens, every primitive, icons, chart wrappers. USE them;
  do not add a primitive inside a feature. If a primitive you need is missing
  or lacks a prop, add it to `src/design/primitives/<Name>/` in a new file or
  with an additive prop, and say so in your report.
- `src/shell/**`, `src/auth/**` (`useSession()` → `{ user, org, role, tasks,
  memberships, switchOrg, signOut }`), `src/app/router.tsx` with a lazy
  placeholder page per area and `RequireTask` guards, `src/app/nav.ts`.
- `src/api/client.ts` (`api.get/post/patch/put/delete`, `ApiError`,
  `NetworkError`), `src/api/types.ts`, `src/api/identity.ts`, `src/api/settings.ts`.
- `src/features/users/**` — the finished Users & roles area: copy its patterns
  (page composition, drawer forms, query hooks, tests).
- Dev gallery at `/dev/design` to see every primitive.

## 1. Ownership

| Agent | Owns (`src/…`) | Routes |
|---|---|---|
| onboarding+operators | `features/onboarding/**`, `features/operators/**`, `features/airports/**`, `features/marketshare/**`, `api/onboarding.ts`, `api/operators.ts`, `api/airports.ts`, `api/marketshare.ts`, `public/register/**` | /onboarding, /operators, /airports, /market-share, /register/:token |
| surveys | `features/surveys/**`, `api/surveys.ts` | /surveys |
| cycles | `features/cycles/**`, `features/overview/**`, `api/cycles.ts`, `shell/CycleStrip.tsx` (wire it) | /cycles, /cycles/new, /cycles/:id, /overview |
| customers+sampling | `features/customers/**`, `features/sampling/**`, `api/customers.ts`, `api/sampling.ts`, `api/invitations.ts` | /customers, /sampling |
| assessments | `features/selfAssessment/**`, `features/history/**`, `api/assessments.ts`, and the shared question-form components in `features/assessmentForm/**` (used by self-assessment AND the public assess flow) | /self-assessment, /history |
| public assess | `public/assess/**` (consumes `features/assessmentForm` components) | /assess/:token |
| dashboard+reports | `features/dashboard/**`, `features/reports/**`, `api/reports.ts` | /dashboard, /reports/* |
| notifications+audit+settings | `features/notifications/**`, `features/audit/**`, `features/settings/**`, `api/notifications.ts`, `api/audit.ts` | /notifications, /audit, /settings |

`src/app/router.tsx`: replace your placeholder imports with your pages — edit
only your lines. `src/api/types.ts`: add your module's types in your own
section (comment-delimited) or in `src/api/<module>.types.ts` — prefer the
latter to avoid conflicts.

## 2. Shared conventions

- Every page: `PageHeader` → content; loading = skeletons matching the final
  layout; error = inline `EmptyState` with request id and retry; empty =
  `EmptyState` with the one primary action.
- Query keys: `['<module>', ...]`; invalidate precisely after mutations.
- Forms: react-hook-form + zod; map `ApiError.details` (field → message) onto
  fields; submit buttons show pending state; drawers confirm before discarding
  dirty state.
- Dates: show in the cycle's time zone with the zone abbreviation; relative
  countdowns for deadlines ("closes in 3 days").
- Numbers: mono font, ratings to 1 dp, percentages to 0 dp, counts with
  thousands separators (en-IN).
- Confidentiality cues: the operator dashboard states "Shared with your
  organisation only" in the header context.
- Phone width works for every page; tables collapse to card lists under 760px
  where a table would need horizontal scroll.
- Tests: at least one render test per page (loading, empty, data) with mocked
  API, plus unit tests for any non-trivial hook or formatter.

## 3. Done means

`npm run typecheck && npm run lint && npm test && npm run build` green with
everyone's areas present (run before reporting; fix only your files; report
anything failing elsewhere). Each page reviewed at 390px and 1440px.
