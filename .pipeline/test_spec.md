# Test Specification

> ⚠️ **Warning:** `.pipeline/surface.json` was not found. The API surface below is
> derived from the approved spec (`<spec>`) and cross-checked against
> `.pipeline/tasks.md`. The 5 endpoints under test are the ones the spec defines and
> implements. Endpoints that appear only in `tasks.md` (full_auth user login/signup/logout,
> `GET`/`PATCH /api/admin/settings`) are **out of scope** — the spec's `admin_only` model
> explicitly leaves task/about routes public and keeps admin auth as minimal scaffolding
> (see the tasks.md open question resolving in favour of the spec). See **Out of scope**.

## Coverage summary
- Total cases: 34
- API endpoints covered: 5 / 5 (spec-derived; surface.json absent)
- User journeys covered: 6

## API tests

All API paths must work both directly (`/api/...`) and behind the ingress prefix
(`/e2e-lane-fastapi-react/api/...`), since the prefix-strip middleware normalises both.

### `GET /api/tasks`
- **Happy path**: No auth header. Fresh seeded DB → `200` with a JSON array of exactly 3
  task objects. Each object has shape `{ id: number, title: string, status: string,
  created_at: string }`. Status values are drawn from `"To do"` / `"Done"` (seed = two
  "To do", one "Done"). Ordering is stable (newest-first / deterministic across calls).
- **Validation failures**: N/A (no request body or params).
- **Auth failures**: None expected — endpoint is public. Sending no credentials must **not**
  return `401`/`403`.
- **Idempotency / edge cases**:
  - After a successful `POST /api/tasks`, the array length increases by exactly 1 and
    includes the new task.
  - DB down (Postgres stopped) → `200` is **not** returned; endpoint returns `503` with a
    generic message body (no stack trace, driver text, or connection string leaked).
  - Empty tasks table (post-migration, pre-seed edge) → `200` with `[]` (must not `500`).

### `POST /api/tasks`
- **Happy path**: Body `{ "title": "Buy milk" }` → `201` (or `200`) with the created task
  object; `status == "To do"`, `id` present, `created_at` present, `title == "Buy milk"`.
  The task is subsequently visible in `GET /api/tasks`.
- **Validation failures**:
  - Empty title `{ "title": "" }` → `422`, no row persisted.
  - Whitespace-only title `{ "title": "   " }` → `422` (schema strips whitespace →
    min_length 1 fails), no row persisted.
  - Missing title `{}` → `422`.
  - Wrong type `{ "title": 123 }` → `422`.
- **Auth failures**: None expected — creation is public (no `401`/`403`).
- **Idempotency / edge cases**:
  - XSS payload `{ "title": "<script>alert(1)</script>" }` → `200`/`201`, stored **raw**
    (byte-for-byte, not HTML-escaped in storage); returned verbatim in the response body.
  - `status` supplied by client in the body is ignored/overridden → persisted status is
    `"To do"`.
  - DB down → `503` with a generic message, no partial write.

### `GET /api/health`
- **Happy path**: `200` with a static body (e.g. `{ "status": "ok" }`). Never touches the DB.
- **Validation failures**: N/A.
- **Auth failures**: None — public.
- **Idempotency / edge cases**: With Postgres **stopped**, still returns `200` (liveness
  must not depend on DB).

### `GET /api/health/deep`
- **Happy path**: DB reachable → runs `SELECT 1` → `200`.
- **Validation failures**: N/A.
- **Auth failures**: None — public.
- **Idempotency / edge cases**: Postgres stopped/unreachable → `503` (readiness reflects DB
  health). Must not `500` or hang beyond a short timeout.

### `POST /api/admin/login`
- **Happy path**: Body `{ "username": <ADMIN_USERNAME>, "password": <ADMIN_PASSWORD> }`
  (seeded creds / env defaults) → `200` with a JWT token in the response body.
- **Validation failures**: Missing username or password field → `422`.
- **Auth failures**:
  - Wrong password → `401` (generic "invalid credentials", no distinction between bad user
    vs bad password).
  - Unknown username → `401`.
- **Idempotency / edge cases**: Issued JWT is verifiable with `JWT_SECRET`. Note: this token
  guards no public route (scaffolding only) — see Out of scope.

## UI / journey tests

All journeys run through the SPA served at basename `/e2e-lane-fastapi-react`; deep-link
loads (`/tasks`, `/tasks/new`, `/about`, `/admin/login`) must return `200` (SPA catch-all)
and hydrate the correct page.

### Journey: View seeded task list
- **Steps**: Navigate to `/tasks` (fresh app, seeded DB).
- **Expected outcomes**: Page shows the `"My Tasks"` header; exactly **3** task rows render;
  each row shows a title and a status badge (`StatusBadge`) reflecting `"To do"` / `"Done"`;
  an `"Add Task"` control is present and links to `/tasks/new`.
- **Negative path**: With Postgres stopped, `/tasks` shows a friendly error state (driven by
  the `503` from `GET /api/tasks`), not a blank page or raw error / stack trace.

### Journey: Create a task (happy path)
- **Steps**: From `/tasks` click `"Add Task"` → lands on `/tasks/new`; type `"Write report"`
  into the `"Title"` field; click `"Create"`.
- **Expected outcomes**: Browser navigates (redirects) to `/tasks`; the list now includes a
  `"Write report"` row with status badge `"To do"`; row count increased by 1.
- **Negative path**: Server-side `422` (should not happen for valid input) surfaces as an
  inline error rather than a crash.

### Journey: Create-task client validation (empty title)
- **Steps**: Go to `/tasks/new`; leave `"Title"` empty (or whitespace only); click `"Create"`.
- **Expected outcomes**: A client-side validation error is shown; **no** `POST /api/tasks`
  request is fired (verify via network capture); staying on `/tasks/new`. DB row count is
  unchanged (verify persisted state).
- **Negative path**: N/A (this case *is* the negative path).

### Journey: About page
- **Steps**: Navigate to `/about`.
- **Expected outcomes**: Page renders an `<h1>` reading `"About Task List"`. Returns `200`
  unauthenticated.
- **Negative path**: N/A (static page, no data dependency).

### Journey: Persistence across reload
- **Steps**: Create a task (as above) → reload `/tasks` (full page reload / new session).
- **Expected outcomes**: The created task still appears (data is DB-backed, not in-memory /
  local state).
- **Negative path**: N/A.

### Journey: Admin login (scaffolding)
- **Steps**: Navigate to `/admin/login`; enter seeded admin username/password; submit.
- **Expected outcomes**: Form POSTs to `/api/admin/login`; on valid creds a token is returned
  and the UI reflects success (no error). On invalid creds, an error message is shown.
- **Negative path**: Wrong credentials → visible "invalid credentials" style error, no token
  stored.

### Cross-cutting UI assertions
- **Public access (no auth)**: Loading `/tasks`, `/tasks/new`, and `/about` while
  unauthenticated returns `200` and renders content — never `401`/`403` and never a login gate.
- **XSS render safety**: After submitting title `<script>alert(1)</script>`, the `/tasks`
  list renders it as **literal visible text**; no script executes (React escapes on render).
- **Ingress prefix**: Loading the app via the ingress URL (`/e2e-lane-fastapi-react/...`)
  resolves all static assets (JS/CSS via Vite `base`) and all `/api/*` calls correctly; the
  app is functional through the prefix, not only via a raw container IP.

## Data integrity tests
- After a successful `POST /api/tasks`, exactly one new `Task` row exists with `status`
  persisted as `"To do"` and a non-null `created_at`.
- A rejected create (empty/whitespace/missing title → `422`) persists **zero** rows; total
  `Task` count is unchanged.
- Seeding is idempotent: seed runs only when the `Task` table is empty; restarting the app on
  a non-empty DB does **not** duplicate the 3 seed tasks or re-add a second admin user.
- On a fresh DB the seed yields exactly 3 tasks (two `"To do"`, one `"Done"`) and exactly one
  `AdminUser` with a bcrypt-hashed (never plaintext) password.
- Task titles are stored raw/unescaped (XSS payload persists byte-for-byte); escaping is a
  render-time concern only.
- `GET /api/tasks` returns tasks in a stable, deterministic order across repeated calls.

## Performance tests
- With ~100 tasks in the DB, `GET /api/tasks` / the `/tasks` page load has **p95 < 500ms**
  (single indexed query, small payload).

## Out of scope
- **full_auth user flows** (`/login`, `/signup`, `/logout`, user-role JWTs): the spec adopts
  `admin_only` — no public signup, task/about routes fully public. These `tasks.md` items are
  not under test pending the resolution noted in the tasks.md open question.
- **Admin settings API** (`GET`/`PATCH /api/admin/settings`) and `/admin/settings` page: not
  defined by the spec's file/route list; no MinIO/object-storage behaviour is specified.
- **MinIO / S3 object storage**: provisioned as a backing service but the spec defines no
  upload/download feature, so there is nothing to exercise.
- **Admin-guarded route protection**: admin auth is baseline scaffolding that guards no public
  route; role-based access control is not exercised by any spec scenario (only the login
  endpoint's credential check is tested above).
- **Port 80 / running uvicorn as root**: accepted deployment risk for the staging lane, not a
  functional test target.
- **k8s probe wiring** (`deployment.yaml` readiness/liveness): the probe *endpoints*
  (`/api/health`, `/api/health/deep`) are tested; the manifest configuration itself is a
  deploy concern, not an app-behaviour test.
