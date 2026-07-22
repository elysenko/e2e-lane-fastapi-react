"""Liveness + readiness probes.
- GET /api/health      → static 200, never touches the DB (liveness).
- GET /api/health/deep → SELECT 1; 200 if DB reachable else 503 (readiness)."""
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from ..database import SessionLocal

log = logging.getLogger("app.health")
router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/health/deep")
def health_deep() -> JSONResponse:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return JSONResponse({"status": "ok", "db": "ok"})
    except Exception as exc:  # DB down/unreachable → readiness fails
        log.warning("deep health check failed: %s", exc.__class__.__name__)
        return JSONResponse({"status": "unavailable", "db": "down"}, status_code=503)
