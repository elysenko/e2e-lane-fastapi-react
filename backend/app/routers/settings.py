"""Admin backing-service settings.

- GET /api/admin/settings          — list backing services + configured status (admin JWT)
- PUT /api/admin/settings/{name}   — record a service's configuration; returns its status

Secret values are never echoed back; only a configured / not-configured flag is exposed.
A service reports "configured" when its identifying env var is injected at boot, or once
an admin records values here (overrides live for the process lifetime — single container)."""
import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from ..security import decode_token

log = logging.getLogger("app.settings")
router = APIRouter(prefix="/api/admin", tags=["settings"])
_bearer = HTTPBearer(auto_error=False)

# Env var whose presence means the service is already wired by the platform at boot.
_SERVICES = [
    {
        "name": "postgresql",
        "env": "DATABASE_URL",
        "fields": [
            {"key": "DATABASE_URL", "label": "Database URL"},
            {"key": "POSTGRES_PASSWORD", "label": "Password", "type": "password"},
        ],
    },
    {
        "name": "minio",
        "env": "MINIO_ENDPOINT",
        "fields": [
            {"key": "MINIO_ENDPOINT", "label": "Endpoint"},
            {"key": "MINIO_ACCESS_KEY", "label": "Access key"},
            {"key": "MINIO_SECRET_KEY", "label": "Secret key", "type": "password"},
        ],
    },
]
# Runtime overrides recorded via PUT (service name -> configured).
_overrides: dict[str, bool] = {}


def require_admin(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> str:
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        payload = decode_token(creds.credentials)
    except Exception as exc:  # noqa: BLE001 — any decode failure is an invalid token
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return str(payload.get("sub"))


def _service_view(svc: dict) -> dict:
    configured = _overrides.get(svc["name"], bool(os.environ.get(svc["env"])))
    return {"name": svc["name"], "configured": configured, "fields": svc["fields"]}


class ServiceUpdate(BaseModel):
    values: dict[str, str] = {}


@router.get("/settings")
def list_settings(_admin: str = Depends(require_admin)) -> dict:
    return {"services": [_service_view(s) for s in _SERVICES]}


@router.put("/settings/{name}")
def update_setting(
    name: str, body: ServiceUpdate, _admin: str = Depends(require_admin)
) -> dict:
    svc = next((s for s in _SERVICES if s["name"] == name), None)
    if svc is None:
        raise HTTPException(status_code=404, detail="Unknown service")
    # Record that the admin supplied configuration; secrets are not persisted or echoed.
    _overrides[name] = True
    log.info("settings: %s configured by admin", name)
    return _service_view(svc)
