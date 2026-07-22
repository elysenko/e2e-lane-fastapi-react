"""Idempotent startup seeding. `init_db()` creates all tables, seeds 3 demo tasks when
the tasks table is empty, and ensures the admin account exists. Wrapped so a missing/down
database logs a warning but never crashes app startup (the app then serves 503 on
DB-backed routes until Postgres is reachable)."""
import logging

from sqlalchemy import func, select

from .config import settings
from .database import Base, SessionLocal, engine
from . import models  # noqa: F401 — register mappings before create_all
from .models import AdminUser, Task
from .security import hash_password

log = logging.getLogger("app.seed")

SEED_TASKS = [
    {"title": "Review the quarterly report", "status": "To do"},
    {"title": "Prepare the launch checklist", "status": "To do"},
    {"title": "Set up the project workspace", "status": "Done"},
]


def _seed_tasks(db) -> None:
    count = db.execute(select(func.count()).select_from(Task)).scalar_one()
    if count and count > 0:
        return
    # Insert oldest-first so the newest-first API ordering matches the intended order.
    for row in reversed(SEED_TASKS):
        db.add(Task(title=row["title"], status=row["status"]))
    db.commit()
    log.info("seed: inserted %d demo tasks", len(SEED_TASKS))


def _seed_admin(db) -> None:
    existing = db.execute(
        select(AdminUser).where(AdminUser.username == settings.ADMIN_USERNAME)
    ).scalar_one_or_none()
    password_hash = hash_password(settings.ADMIN_PASSWORD)
    if existing is None:
        db.add(AdminUser(username=settings.ADMIN_USERNAME, password_hash=password_hash))
    else:
        # Re-assert the password every run so rotated env creds stay in sync.
        existing.password_hash = password_hash
    db.commit()
    log.info("seed: admin user ensured (%s)", settings.ADMIN_USERNAME)


def init_db() -> None:
    """Create tables + seed. Non-fatal: never raises."""
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            _seed_tasks(db)
            _seed_admin(db)
    except Exception as exc:  # pragma: no cover - defensive; DB may be down at boot
        log.warning("init_db skipped (database unavailable): %s", exc)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
