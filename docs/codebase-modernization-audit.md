# Codebase Modernization Audit

Date: 2026-07-09

## Scope

This audit covers the requested priority areas:

1. Authentication
2. Dashboard
3. Bookings
4. Memberships
5. Billing
6. Customer Portal
7. Landing Page

The app is already functional. The recommended work below is incremental and
behavior-preserving: simplify existing modules, consolidate repeated patterns,
and avoid UI redesign or business logic changes.

## Audit Signals

- `npm run lint` passes with zero warnings.
- Import reachability found only a few unreferenced candidates.
- The largest maintainability risks are long feature files, repeated server
  context resolvers, repeated API route ceremony, and repeated client form/action
  state patterns.
- The codebase already has useful primitives: `ok`, `created`, `fail`,
  `handleApiError`, `validateRequest`, `requireSession`, permission helpers, and
  feature service modules. Modernization should reuse these instead of replacing
  them.

## AI-Generated Patterns Observed

- Large "god modules" with many unrelated responsibilities in a single file.
- Copy-pasted feature context resolvers that differ mostly by error text and
  Prisma select shape.
- Repeated page-level auth guards across dashboard pages.
- Repeated form submit/status/error handling in client components.
- Repeated modal/error dialog wiring across management screens.
- Long API handlers that combine parsing, validation, security checks,
  persistence, notification side effects, and response shaping.
- Many local `useState` flags in complex components where a reducer or a small
  view-state helper would be clearer.

## Dead Code Summary

Potentially unreferenced by the current Next.js entry graph:

- `src/features/auth/components/sign-out-button.jsx`
- `src/components/i18n/loading-message.jsx`
- `src/components/ui/loading-state.jsx`
- `src/components/ui/index.js`

Notes:

- Lint does not report unused imports or variables.
- The current worktree already has changes in some shared UI files, so dead-code
  deletion should be handled intentionally and separately.

## Cross-Cutting Duplication

- Error dialog block repeated in at least 11 management components.
- Business context resolution repeated in analytics, availability, customers,
  memberships, notifications, reviews, AI, and team modules.
- Dashboard page guard and business fetch repeated across seven dashboard pages.
- Form status blocks repeated in service, booking, customer, membership, and
  availability forms.
- API route flow repeated across many handlers:
  `request.json()` -> `validateRequest()` -> `fail()` -> service call ->
  `handleApiError()`.

## Module Reports

### Authentication

Current complexity score: 8/10

Measured shape:

- 46 files, about 3,803 non-empty LOC.
- 9 auth API/middleware files.
- Longest files: `user-profile-menu.jsx`, `login-form.jsx`,
  `register-form.jsx`, `session-context.js`, `forgot-password/route.js`.
- Long functions: `forgot-password POST` at about 223 lines,
  `register POST` at about 135 lines, middleware at about 77 lines.

Refactor opportunities:

- Extract shared auth form UI primitives for input styling, icons, and status
  alerts.
- Split password-reset delivery into small helper functions inside the route or
  a focused service.
- Simplify middleware into route guard helpers with early returns.
- Reduce duplicate callback URL and OAuth button divider rendering between login
  and register.
- Keep `auth-options.js` but extract token/session assignment helpers if it grows.

Dead code report:

- `sign-out-button.jsx` appears unused; sign-out is handled by
  `user-profile-menu.jsx`.

Duplication report:

- `authInputClassName` and input icon rendering are duplicated across auth forms.
- Alert/status markup is duplicated across forgot/reset/register/login/change
  password forms.
- Google divider markup is duplicated in login and register.
- Auth API routes repeat JSON parsing and validation.

Proposed simplification plan:

- First, add small auth form primitives and update auth forms without changing
  rendered classes.
- Next, introduce shared API request helpers for JSON validation.
- Then refactor `forgot-password/route.js` into named helper steps while keeping
  the same response messages and status codes.
- Finally, simplify middleware route guards.

### Dashboard

Current complexity score: 10/10

Measured shape:

- 25 files, about 4,446 non-empty LOC.
- Longest files: `analytics-dashboard.jsx`, `app-shell.jsx`,
  `overview-dashboard.jsx`, `analytics/metrics.js`.
- Four files are over 600 LOC.

Refactor opportunities:

- Break analytics dashboard sections into focused presentational components.
- Extract repeated dashboard page session/business guard into one server helper.
- Keep `AppShell` behavior but split search, mobile sidebar state, and navigation
  rendering into smaller local components/hooks.
- Move analytics metric formatting and trend helpers into pure functions with
  direct tests when test infrastructure exists.

Dead code report:

- No dashboard-specific unreachable files found.

Duplication report:

- Dashboard route guard repeated across availability, bookings, customers,
  memberships, notifications, services, and team pages.
- Analytics cards and empty/loading/error states repeat local structures already
  present elsewhere.

Proposed simplification plan:

- Introduce `requireDashboardPageContext()` for page guards and business select.
- Split analytics dashboard into summary, charts, tables, and insight sections.
- Keep UI output stable; move data transformation out of JSX-heavy files first.

### Bookings

Current complexity score: 9/10

Measured shape:

- 38 files, about 4,004 non-empty LOC.
- 15 API files.
- Longest files: `booking-management.jsx`, `bookings/server.js`,
  `public-booking-form.jsx`, `dashboard-booking-form.jsx`.
- Long function: `GET /api/bookings` at about 101 lines.

Refactor opportunities:

- Extract booking filters/query parsing from route handlers into pure functions.
- Consolidate booking action status handling in management components.
- Keep booking lifecycle and occupancy services, but split broad server functions
  by read/write concern.
- Reuse shared form status and action error helpers.

Dead code report:

- No booking-specific unreachable files found.

Duplication report:

- Booking forms repeat status, field error, submit button, and API error patterns.
- Booking API routes repeat auth, validation, status update, and response
  handling.

Proposed simplification plan:

- Start with route-level query parsing helpers.
- Then split `booking-management.jsx` into table/list, filters, dialogs, and
  action controls.
- Avoid changing booking statuses, slot calculations, or notification behavior.

### Memberships

Current complexity score: 10/10

Measured shape:

- 25 files, about 4,191 non-empty LOC.
- 11 API files.
- `memberships/server.js` is about 1,684 non-empty LOC and is the largest
  priority module file.

Refactor opportunities:

- Split `memberships/server.js` by responsibility:
  plan management, enrollment, renewal/cancellation, Stripe reconciliation, and
  analytics.
- Keep exported function names stable while moving private helpers into
  service-specific files.
- Extract membership plan form status/submission helpers shared with other forms.

Dead code report:

- No membership-specific unreachable files found.

Duplication report:

- Business context resolver is duplicated from other feature server modules.
- Membership API routes repeat validate/fail/service/handle flow.
- Management dashboards repeat error dialog and action status blocks.

Proposed simplification plan:

- Introduce a shared business-context helper before moving membership logic.
- Split private helper groups from `server.js` without changing public exports.
- Refactor components after server logic is separated.

### Billing

Current complexity score: 8/10

Measured shape:

- 16 files, about 2,649 non-empty LOC.
- Longest files: `billing/server.js`, Stripe webhook route,
  `billing-management.jsx`, checkout route.
- Branch density is high at about 12.9 branches per 100 LOC.

Refactor opportunities:

- Extract checkout request validation and Stripe session creation steps.
- Split billing server into subscription status, Stripe customer/subscription
  synchronization, and plan catalog interaction.
- Keep webhook idempotency flow but move event handlers into named functions.

Dead code report:

- No billing-specific unreachable files found.

Duplication report:

- Billing API routes repeat business context and response handling.
- Webhook route includes nested persistence and processing stages that can be
  named and tested independently.

Proposed simplification plan:

- First split pure Stripe mapping/status helpers.
- Then refactor checkout route into parse, authorize, create session, respond.
- Keep all Stripe event names and persisted fields unchanged.

### Customer Portal

Current complexity score: 8/10

Measured shape:

- 23 files, about 2,622 non-empty LOC.
- Longest files: `customer-booking-actions.jsx` and `customer-portal/server.js`.
- `customer-booking-actions.jsx` has more than 20 hook usages.

Refactor opportunities:

- Replace many local state flags in booking actions with a small reducer or
  explicit mode-state helper.
- Split server dashboard aggregation into named query functions.
- Reuse shared booking card/action components where business and customer views
  overlap.

Dead code report:

- No customer-portal-specific unreachable files found.

Duplication report:

- Customer booking action flows repeat details loading, reschedule slot loading,
  submit status, and toast handling in one large component.
- Portal server has multiple dashboard queries assembled in one long function.

Proposed simplification plan:

- Start by extracting pure label/format helpers from booking actions.
- Then split details, cancel, reschedule, and review UI sections.
- Keep URLs, customer permissions, and booking lifecycle behavior unchanged.

### Landing Page

Current complexity score: 7/10

Measured shape:

- 7 files, about 2,287 non-empty LOC.
- Longest files: `home-page.jsx`, public business detail/list pages, discover
  page.
- Lower branch density than feature modules, but high JSX volume.

Refactor opportunities:

- Split `home-page.jsx` into section components by existing visual sections.
- Extract repeated public listing card formatters.
- Keep visual output and copy stable; focus on named sections and smaller
  arrays/configuration.

Dead code report:

- No landing-specific unreachable files found.

Duplication report:

- Public business/discover pages repeat card/list layout and image handling.
- Footer and navigation arrays are local to one large file and can remain there
  unless reused.

Proposed simplification plan:

- Split `home-page.jsx` into section components only.
- Extract shared public business card only if the duplicated markup remains
  identical after reading both pages.

## Recommended Refactor Order

1. Authentication form primitives and middleware simplification.
2. Shared API JSON validation helper.
3. Shared business-context/page guard helper.
4. Dashboard guard adoption.
5. Bookings route parsing and management component split.
6. Membership server split behind stable exports.
7. Billing checkout/webhook extraction.
8. Customer portal booking action split.
9. Landing page section split.

## Validation Strategy

- Run `npm run lint` after each module batch.
- Run `npm run build` after cross-module helper changes.
- For behavior-sensitive routes, preserve response messages, status codes,
  redirect paths, and payload shapes.
- Avoid deleting dead-code candidates from modified files until their ownership
  is clear in the worktree.
