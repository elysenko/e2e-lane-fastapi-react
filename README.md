# e2e-lane-fastapi-react — Task List

A single-container **FastAPI + React + PostgreSQL** app. FastAPI serves both the built
React SPA and the JSON API on port 80, behind an ingress that mounts the app under
`/e2e-lane-fastapi-react`.

## Features
- **My Tasks** (`/tasks`) — public list of tasks, seeded with 3 demo tasks, each with a
  `To do` / `Done` status badge.
- **Add Task** (`/tasks/new`) — create a task with a title (client + server validation).
- **About** (`/about`) — static info page.
- **Admin login** (`/admin/login`) — minimal seeded admin auth (scaffolding baseline).

All task/about routes are public — no login required.

## Architecture
- **Backend** — `backend/app` FastAPI app (SQLAlchemy 2.x, psycopg2, PostgreSQL). All API
  routes are under `/api/*`. It also serves the built SPA from `STATIC_DIR` (`web/dist`,
  baked into the image) with a deep-link catch-all so React Router routes reload cleanly.
- **Frontend** — `web/` Vite + React 18 + TypeScript SPA. Built with Vite `base` set to
  the ingress prefix and React Router `basename` derived from it.
- **Single container** — the root `Dockerfile` is a multi-stage build: Node compiles the
  SPA, then a Python image serves API + SPA via `uvicorn app.main:app --port 80`.

## API
| Method | Path                 | Purpose                                         |
|--------|----------------------|-------------------------------------------------|
| GET    | `/api/tasks`         | List tasks (newest first). Public.              |
| POST   | `/api/tasks`         | Create a task (`{"title": "..."}`). Public.     |
| GET    | `/api/health`        | Liveness — static 200, no DB.                   |
| GET    | `/api/health/deep`   | Readiness — `SELECT 1`; 200 or 503.             |
| POST   | `/api/admin/login`   | Verify seeded admin creds → JWT.                |

`POST /api/tasks` returns `422` for an empty / whitespace-only / missing / wrong-type
title, and defaults `status` to `To do` (client-supplied status is ignored). When the
database is down, the task routes return a generic `503` (no internals leaked).

## Environment variables
| Var              | Default                          | Purpose                              |
|------------------|----------------------------------|--------------------------------------|
| `DATABASE_URL`   | `postgresql://…/app`             | Postgres DSN (sync psycopg2).        |
| `BASE_PATH`      | `/e2e-lane-fastapi-react`        | Ingress prefix (strip middleware).   |
| `ADMIN_USERNAME` | `admin`                          | Seeded admin login username.         |
| `ADMIN_PASSWORD` | `admin`                          | Seeded admin login password.         |
| `JWT_SECRET`     | `dev-secret-change-me`           | HS256 signing secret.                |
| `STATIC_DIR`     | `static` (`/app/static` in image)| Built SPA directory.                 |

## Local development
```bash
# Backend
cd backend
pip install -r requirements.txt
python -m app.init_db && python seed.py        # create tables + seed
uvicorn app.main:app --reload --port 3000

# Frontend (proxies /api to :3000)
cd web
npm install
npm run dev
```

## Build & run (single container)
```bash
docker build -t task-list .
docker run -p 80:80 -e DATABASE_URL=postgresql://... task-list
```

Tables are created and demo data seeded at boot (idempotent, non-fatal if the DB is
temporarily unavailable — the app still boots and serves `503` on DB-backed routes).
