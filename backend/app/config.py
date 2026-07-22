"""Runtime configuration via pydantic-settings. All values come from the environment
(injected by the platform through the `app-secrets` secret). Sensible dev defaults keep
local runs working without a .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Ignore the many unrelated env vars the platform injects (PG*, MINIO_*, etc.).
    model_config = SettingsConfigDict(env_file=None, extra="ignore", case_sensitive=False)

    # Sync SQLAlchemy engine + psycopg2 driver → a bare postgresql:// URL is correct.
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/app"

    # Ingress prefix this app is mounted under. The ingress rewrite normally strips it
    # before the request reaches us; the prefix-strip middleware tolerates it if present.
    BASE_PATH: str = "/e2e-lane-fastapi-react"

    # Seeded admin credentials for POST /api/admin/login (scaffolding baseline).
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin"

    # JWT signing secret (HS256).
    JWT_SECRET: str = "dev-secret-change-me"

    # Directory holding the built SPA (web/dist). Set by the Docker image; when absent
    # (pure API/dev run) static serving is skipped gracefully.
    STATIC_DIR: str = "static"


settings = Settings()
