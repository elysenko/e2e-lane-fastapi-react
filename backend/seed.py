"""Demo seed. PLATFORM CONTRACT: print one `SEED_CRED <ROLE> <identity> <password>` line
per demo account AND a single `SEED_CREDS_JSON [...]` line — the deploy parses stdout into
the deployment's demo credentials. Idempotent (upsert by identity). Also ensures the demo
tasks + admin exist (delegates to app.seed.init_db)."""
import json

from sqlalchemy import select

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import User
from app.security import hash_password
from app.seed import init_db

DEMO_USERS = [
    {"role": "ADMIN", "email": "admin@example.com", "password": "Admin123!", "name": "Demo Admin"},
    {"role": "USER", "email": "user@example.com", "password": "User123!", "name": "Demo User"},
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    # Seed demo tasks + the admin-login account (username/password from env).
    init_db()

    creds = []
    with SessionLocal() as db:
        for u in DEMO_USERS:
            existing = db.execute(select(User).where(User.email == u["email"])).scalar_one_or_none()
            if existing is None:
                db.add(User(email=u["email"], password_hash=hash_password(u["password"]), role=u["role"], name=u["name"]))
            print(f"SEED_CRED {u['role']} {u['email']} {u['password']}")
            creds.append({"role": u["role"], "email": u["email"], "password": u["password"]})
        db.commit()

    # Admin-login credential (POST /api/admin/login uses username, not email).
    print(f"SEED_CRED ADMIN {settings.ADMIN_USERNAME} {settings.ADMIN_PASSWORD}")
    creds.append({"role": "ADMIN", "email": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD})

    print(f"SEED_CREDS_JSON {json.dumps(creds)}")


if __name__ == "__main__":
    main()
