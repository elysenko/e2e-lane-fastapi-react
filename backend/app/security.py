"""Password hashing (bcrypt via passlib) and JWT issue/verify (pyjwt, HS256).
Shared by the seed scripts and the auth router."""
import time

import jwt
from passlib.context import CryptContext

from .config import settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _pwd.verify(password, password_hash)
    except ValueError:
        return False


def create_token(sub: str, role: str = "admin", ttl_seconds: int = 60 * 60 * 24) -> str:
    now = int(time.time())
    return jwt.encode(
        {"sub": sub, "role": role, "iat": now, "exp": now + ttl_seconds},
        settings.JWT_SECRET,
        algorithm="HS256",
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
