# Architecture

## Requested stack
`fastapi-react` — Vite + React (TypeScript) SPA served by FastAPI, backed by PostgreSQL, single-container deploy on port 80 behind the existing ingress prefix.

## Scaffolding status
- **Newly scaffolded** — the repository previously contained only placeholder infra (`Dockerfile` serving a static `index.html` via nginx, `nginx.conf`, `k8s/*.yaml`, `kustomization.yaml`). No application source existed. The scaffolder copied `template-fastapi-react/` from the platform's scaffold-templates into the project root.

## Layout
- `backend/` — FastAPI app.
  - `app/main.py` — app entrypoint (routers, static mount, startup hooks).
  - `app/database.py` — SQLAlchemy engine/session.
  - `app/models.py` — ORM models.
  - `app/auth.py` — auth helpers (JWT/bcrypt).
  - `app/init_db.py`, `seed.py` — table creation / seed data.
  - `requirements.txt` — fastapi, uvicorn, sqlalchemy, psycopg2-binary, pyjwt, passlib[bcrypt].
- `web/` — Vite + React + TypeScript SPA.
  - `src/App.tsx`, `src/main.tsx` — app bootstrap and routes.
  - `src/pages/` — page components (`Home.tsx`, `Login.tsx`; the plan adds `TasksPage`, `NewTaskPage`, `AboutPage`, `AdminLoginPage`).
  - `src/lib/api.ts` — fetch helpers.
  - `vite.config.ts`, `tsconfig.json`, `package.json`, `index.html`.
- `k8s/` — pre-existing deployment/service/ingress manifests (namespace `colossus-e2e-lane-fastapi-react`), untouched by scaffolding.
- Root `Dockerfile`, `index.html`, `nginx.conf` — pre-existing placeholder files; per the plan these are to be replaced with a multi-stage build (Node builds the React app → Python/uvicorn serves FastAPI + built static assets on :80) and the standalone `index.html`/`nginx.conf` deleted, since FastAPI now serves the SPA directly.
- `colossus.yaml` — build manifest for deploy agents: `framework: react`, `projectName: web`, `outputDir: web/dist`, backend build in `backend/` on port 3000, single container listens on port 80 with SPA fallback.

## Next steps for the developer / coder agent
1. Implement the backend routers (`app/routers/tasks.py`, `health.py`, `auth.py`), config, schemas per the plan.
2. Implement frontend pages/components and routing with `basename`/`base` set to the ingress prefix (`/e2e-lane-fastapi-react`).
3. Replace the root `Dockerfile` with the multi-stage build described in the plan; delete the placeholder `index.html` and `nginx.conf`.
4. Add readiness/liveness probes to `k8s/deployment.yaml` hitting `/api/health` and `/api/health/deep`.
5. Set `DATABASE_URL` (via `app-secrets` in the cluster) and other env vars (`BASE_PATH`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`).
6. Locally: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload` and `cd web && npm install && npm run dev`.

## Template source
`template-fastapi-react` from the platform scaffold-templates directory.
