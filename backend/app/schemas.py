"""Pydantic (v2) request/response schemas."""
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

# Non-empty title: whitespace stripped, then at least 1 char required.
# "" and whitespace-only titles fail validation → HTTP 422.
TitleStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class TaskCreate(BaseModel):
    # Extra fields (e.g. a client-supplied `status`) are ignored → status is server-owned.
    model_config = ConfigDict(extra="ignore")
    title: TitleStr


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    status: str
    created_at: datetime


class AdminLogin(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    token: str
    role: str = "admin"
