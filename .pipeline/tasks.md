# Pipeline Task Decomposition

## Summary
A single-container FastAPI + React + PostgreSQL app that serves a public task list (seeded with 3 tasks), a create-task form with client + server validation, and an about page. It exposes a minimal seeded auth surface and an admin section, is served under the ingress prefix `/e2e-lane-fastapi-react`, and binds uvicorn to `0.0.0.0:80` while FastAPI serves both the API and the built SPA (with SPA deep-link fallback).

## Surface contract
Routes / screens (SPA under basename `/e2e-lane-fastapi-react`):
- `/` → redirect to `/tasks`
- `/tasks` — "My Tasks" list (title + status badge rows, "Add Task" button)
- `/tasks/new` — create-task form ("Title" field, "Create" button)
- `/about` — "About Task List" heading
- `/login` — user login (full_auth)
- `/signup` — user signup (full_auth)
- `/admin/login` — admin login
- `/admin/settings` — admin settings page (protected, admin role)

API endpoints:
- `GET /api/tasks` — list all tasks
- `POST /api/tasks` — create task (title required, status defaults "To do")
- `GET /api/health` — static 200
- `GET /api/health/deep` — `SELECT 1`; 200 if DB ok else 503
- `POST /api/admin/login` — verify admin credentials, return JWT
- Auth flows (full_auth): user login / signup / logout
- `GET /api/admin/settings` — list service/setting keys with masked values + configured status (admin only)
- `PATCH /api/admin/settings` — upsert key-value settings (admin only)

Entities:
- `Task` (id, title, status, created_at)
- `User` / `AdminUser` (id, username, password_hash, role)
- `SystemSetting` (key, value, updatedAt)

Auth model: **full_auth** (roles: admin, user). Public: `/tasks`, `/tasks/new`, `/about` return 200 unauthenticated.

## db_agent tasks
- [ ] Create SQLAlchemy engine in `backend/app/database.py` with `pool_pre_ping=True`, `SessionLocal`, and `get_db` dependency.
- [ ] Define `Task` model in `backend/app/models.py` — `id`, `title: str`, `status: str` (default `"To do"`), `created_at` (indexed for stable newest ordering).
- [ ] Define `User` model (username, password_hash) with `enum UserRole { ADMIN, USER }` and `role UserRole @default(USER)`; retain seeded `AdminUser` for `/api/admin/login` baseline compliance.
- [ ] Define `SystemSetting` model — `key String @id`, `value String`, `updatedAt DateTime @updatedAt` (for admin settings backing postgresql + minio deployments).
- [ ] Define Pydantic schemas in `backend/app/schemas.py` — `TaskCreate` (`constr(strip_whitespace=True, min_length=1)` title) and `TaskOut`.
- [ ] Implement seed logic in `backend/app/seed.py` — `init_db()` creates tables; if `Task` count is 0 insert 3 tasks (two "To do", one "Done"); if no admin/user exists seed admin with hashed password; wrap so failures log but do not raise.

## backend_agent tasks
- [ ] Implement `backend/app/config.py` via pydantic-settings — `DATABASE_URL`, `BASE_PATH` (default `/e2e-lane-fastapi-react`), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, plus MinIO/S3 connection env keys.
- [ ] Implement `backend/app/security.py` — bcrypt hash/verify (passlib) and JWT issue/verify (pyjwt).
- [ ] Implement `backend/app/routers/tasks.py` — `GET /api/tasks` (all tasks, stable newest ordering); `POST /api/tasks` (validate title, persist status "To do", return created task); on `OperationalError`/connection failure return 503 with generic message.
- [ ] Implement `backend/app/routers/health.py` — `GET /api/health` static 200; `GET /api/health/deep` runs `SELECT 1`, 200 if DB ok else 503.
- [ ] Implement `backend/app/routers/auth.py` — `POST /api/admin/login` verifies credentials and returns JWT; add full_auth user flows (login, signup, logout) where first signup user gets `ADMIN` role and subsequent users get `USER`.
- [ ] Generate admin guard middleware + protect `(admin)` route group via role check; admin can always log in.
- [ ] Assemble `backend/app/main.py` — create app; add middleware stripping leading `BASE_PATH` from request path (ingress compatibility); include routers; mount `StaticFiles`; add SPA catch-all GET returning `index.html` for non-API routes; call `init_db()` on startup (non-fatal).
- [ ] Implement `backend/app/lib/config.ts` equivalent `resolveConfig(key)` (Python module) — read `process.env[key]`/env first; if value is `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, read from `SystemSetting` DB row; return null if neither set.
- [ ] Implement `GET /api/admin/settings` (list postgresql + minio service keys with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, admin role required).
- [ ] Write `backend/requirements.txt` — fastapi, uvicorn[standard], sqlalchemy, psycopg[binary], pydantic, pydantic-settings, passlib[bcrypt], pyjwt, plus MinIO/S3 client dependency.

## ui_agent tasks
- [ ] Scaffold frontend — `package.json`, `vite.config.ts` (`base = "/e2e-lane-fastapi-react/"`), `tsconfig.json`, `index.html`, `src/main.tsx` (`BrowserRouter basename="/e2e-lane-fastapi-react"`).
- [ ] Implement `src/App.tsx` routes — `/`→redirect `/tasks`, `/tasks`, `/tasks/new`, `/about`, `/login`, `/signup`, `/admin/login`, `/admin/settings`.
- [ ] Build `src/pages/TasksPage.tsx` — "My Tasks" header, list rows via `TaskRow`, "Add Task" button linking to `/tasks/new`; loading, empty, and 503/friendly-error states.
- [ ] Build `src/pages/NewTaskPage.tsx` — controlled "Title" input, "Create" button, client validation (block empty, no request), redirect to `/tasks` on success.
- [ ] Build `src/pages/AboutPage.tsx` — renders `<h1>About Task List</h1>`.
- [ ] Build `src/pages/AdminLoginPage.tsx` and full_auth `/login` + `/signup` screens as part of the main app; admin section in nav visible only to admins.
- [ ] Build components `src/components/TaskRow.tsx` (title + status badge) and `src/components/StatusBadge.tsx`.
- [ ] Build `src/pages/AdminSettingsPage.tsx` at `/admin/settings` — list each service in postgresql + minio with configured/unconfigured badge and per-service credential form (protected, admin role).

## service_agent tasks
- [ ] Implement `src/api.ts` — fetch helpers that prefix `BASE_PATH` for all `/api/*` calls so requests survive ingress routing.
- [ ] Wire `TasksPage` to `GET /api/tasks` — handle 200 list, loading, and 503 error responses.
- [ ] Wire `NewTaskPage` to `POST /api/tasks` and navigate to `/tasks` on success; surface server 422 validation errors.
- [ ] Wire `AdminLoginPage` / login / signup screens to auth endpoints; store/attach JWT for admin-guarded requests.
- [ ] Wire `AdminSettingsPage` to `GET /api/admin/settings` and `PATCH /api/admin/settings` (masked values, upsert on save).

## tester tasks
- [ ] `/tasks` first load shows "My Tasks" and exactly 3 seeded rows with status badges.
- [ ] "Add Task" navigates to `/tasks/new`; creating with a title redirects to `/tasks` and shows the new task with status "To do".
- [ ] Empty title → client validation error, no POST fired, DB unchanged.
- [ ] `/about` shows "About Task List".
- [ ] Reload `/tasks` after adding → task persists (DB-backed).
- [ ] `GET /tasks`, `/tasks/new`, `/about` return 200 unauthenticated (no 401/403).
- [ ] XSS: submit `<script>alert(1)</script>` title → stored, rendered as literal text, no execution.
- [ ] DB down → `/tasks` returns 503 / friendly error; `/api/health/deep` returns 503; `/api/health` still 200.
- [ ] Load `/tasks` with ~100 tasks; confirm p95 < 500ms.
- [ ] Verify assets and API load correctly through the ingress prefix URL.
- [ ] Admin flow: admin login succeeds; `/admin/settings` requires admin role and blocks non-admin users.

## Open questions
- Spec's `## Auth` section describes `admin_only` (public task/about routes, seeded admin, no public signup), but the pipeline auth model is `full_auth` (roles admin, user). Task list applies `full_auth` per pipeline inputs — confirm whether public `/login` + `/signup` screens and user role flows are actually desired, or whether the spec's admin-only intent should override.
- `minio` is provisioned as a backing service but the spec defines no object-storage behaviour (no uploads/downloads). Admin settings tasks include it for credential configuration; confirm whether any feature actually consumes MinIO.
- No `<placeholder_services>`, `<placeholder_integrations>`, or `<spec_integrations>` were provided, so no placeholder banner or integration client modules were generated — confirm none are needed.
- Scaffolder summary was empty; downstream agents should confirm the actual on-disk layout before creating files.
