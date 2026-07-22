"""Authentication endpoints.

- POST /api/admin/login  — verify seeded admin credentials, return a JWT (spec baseline).
- POST /api/auth/login   — user login (kept from scaffold; guards no public route).
- GET  /api/auth/me      — current user from bearer token.

None of these guard the public task/about routes — auth here is scaffolding only."""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..auth import get_current_user, sign_token
from ..auth import verify_password as verify_user_password
from ..database import get_db
from ..models import AdminUser, User
from ..schemas import AdminLogin, TokenOut
from ..security import create_token, verify_password

log = logging.getLogger("app.auth")
router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/admin/login", response_model=TokenOut)
def admin_login(body: AdminLogin, db: Session = Depends(get_db)) -> TokenOut:
    try:
        admin = db.execute(
            select(AdminUser).where(AdminUser.username == body.username)
        ).scalar_one_or_none()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Login is temporarily unavailable.") from exc
    # Generic message: do not distinguish unknown user from wrong password.
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenOut(token=create_token(sub=admin.username, role="admin"), role="admin")


class UserLogin(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def user_login(body: UserLogin, db: Session = Depends(get_db)) -> dict:
    user = db.execute(select(User).where(User.email == body.email)).scalar_one_or_none()
    if user is None or not verify_user_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "token": sign_token(user),
        "user": {"id": user.id, "email": user.email, "role": user.role, "name": user.name},
    }


@router.get("/auth/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email, "role": user.role, "name": user.name}
