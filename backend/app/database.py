"""SQLAlchemy 2.x engine/session wiring. DATABASE_URL is injected by the platform
(postgresql://...). Sync engine + psycopg2 driver (bare postgresql:// URL is correct).
Tables are created at app/container startup — never at import time."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
