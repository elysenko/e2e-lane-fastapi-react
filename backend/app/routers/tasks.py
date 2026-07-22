"""Public task API. No auth guards — /tasks is fully public per the spec.
DB/connection failures surface as a generic 503 (no driver text or connection string
leaked)."""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task
from ..schemas import TaskCreate, TaskOut

log = logging.getLogger("app.tasks")
router = APIRouter(prefix="/api", tags=["tasks"])

_UNAVAILABLE = "Tasks are temporarily unavailable. Please try again in a moment."


@router.get("/tasks", response_model=list[TaskOut])
def list_tasks(db: Session = Depends(get_db)) -> list[Task]:
    try:
        # Stable newest-first ordering.
        return list(
            db.execute(
                select(Task).order_by(Task.created_at.desc(), Task.id.desc())
            ).scalars().all()
        )
    except (OperationalError, SQLAlchemyError) as exc:
        log.warning("GET /api/tasks failed: %s", exc.__class__.__name__)
        raise HTTPException(status_code=503, detail=_UNAVAILABLE) from exc


@router.post("/tasks", response_model=TaskOut, status_code=201)
def create_task(body: TaskCreate, db: Session = Depends(get_db)) -> Task:
    # Title is validated by TaskCreate (empty / whitespace-only → 422 before reaching here).
    # status is server-owned; any client-supplied value is ignored.
    task = Task(title=body.title, status="To do")
    try:
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    except (OperationalError, SQLAlchemyError) as exc:
        db.rollback()
        log.warning("POST /api/tasks failed: %s", exc.__class__.__name__)
        raise HTTPException(status_code=503, detail=_UNAVAILABLE) from exc
