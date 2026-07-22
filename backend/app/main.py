"""FastAPI app entry — single container serving the built React SPA + the JSON API on
one port. Layout:
  - /api/*              → API routers (tasks, health, auth)
  - /assets/*           → hashed build assets (StaticFiles)
  - everything else GET → index.html (SPA deep-link catch-all)

The ingress rewrite strips the `/e2e-lane-fastapi-react` prefix before requests arrive,
but PrefixStripMiddleware also tolerates it for direct (non-ingress) access. GET
/api/health is kept intact — the platform's backend reachability probe depends on it."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .routers import auth, health, tasks
from .seed import init_db

log = logging.getLogger("app")


class PrefixStripMiddleware:
    """ASGI middleware that strips a leading BASE_PATH from the request path so the app
    works both behind the ingress (prefix already stripped) and via direct access."""

    def __init__(self, app, prefix: str):
        self.app = app
        self.prefix = (prefix or "").rstrip("/")

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http" and self.prefix:
            path = scope.get("path", "")
            if path == self.prefix or path.startswith(self.prefix + "/"):
                new_path = path[len(self.prefix):] or "/"
                scope = dict(scope)
                scope["path"] = new_path
                if scope.get("raw_path") is not None:
                    scope["raw_path"] = new_path.encode("utf-8")
        await self.app(scope, receive, send)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Non-fatal: seeding logs but never crashes boot when the DB is down.
    init_db()
    yield


app = FastAPI(
    title="task-list",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)
app.add_middleware(PrefixStripMiddleware, prefix=settings.BASE_PATH)

# API routers first so they always win over the SPA catch-all.
app.include_router(health.router)
app.include_router(tasks.router)
app.include_router(auth.router)

# ---- Static SPA serving -------------------------------------------------------------
_STATIC_DIR = os.path.abspath(settings.STATIC_DIR)
_INDEX_FILE = os.path.join(_STATIC_DIR, "index.html")
_ASSETS_DIR = os.path.join(_STATIC_DIR, "assets")

if os.path.isdir(_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=_ASSETS_DIR), name="assets")


def _safe_static_file(rel_path: str) -> str | None:
    """Resolve a root-level static file (favicon, vite.svg, …) safely inside STATIC_DIR."""
    if not rel_path:
        return None
    candidate = os.path.abspath(os.path.join(_STATIC_DIR, rel_path))
    if candidate != _STATIC_DIR and not candidate.startswith(_STATIC_DIR + os.sep):
        return None  # path traversal attempt
    return candidate if os.path.isfile(candidate) else None


@app.get("/{full_path:path}")
def spa_catch_all(full_path: str):
    # API routes are registered above; guard explicitly so unknown /api/* → 404 JSON,
    # never the SPA HTML.
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")
    served = _safe_static_file(full_path)
    if served:
        return FileResponse(served)
    if os.path.isfile(_INDEX_FILE):
        return FileResponse(_INDEX_FILE)
    # Dev / API-only run with no built SPA present.
    raise HTTPException(status_code=404, detail="SPA build not found")
