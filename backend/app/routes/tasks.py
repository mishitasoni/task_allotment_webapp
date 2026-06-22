from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import re

from app.database.dependencies import get_db
from app.models.task import Task
from app.schemas.schemas import (
    TaskCreate,
    TaskResponse,
    TaskUpdate
)

router = APIRouter()

from datetime import datetime

# URL validation regex
URL_REGEX = re.compile(
    r'^(?:http|ftp)s?://' # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' # domain...
    r'localhost|' # localhost...
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' # ...or ip
    r'(?::\d+)?' # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE)

def validate_url(url: str):
    if not url:
        return
    if not URL_REGEX.match(url):
        raise HTTPException(status_code=400, detail="Invalid URL format. Please provide a valid URL starting with http:// or https://")


def validate_eta(eta_str: str):
    if not eta_str:
        return
    
    parsed_dt = None
    cleaned = eta_str.strip()
    if cleaned.endswith('Z'):
        cleaned = cleaned[:-1]
        
    for fmt in (
        "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", 
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", 
        "%Y-%m-%d", "%d-%m-%Y %H:%M:%S", 
        "%d-%m-%Y %H:%M", "%d-%m-%Y", 
        "%m-%d-%Y %H:%M:%S", "%m-%d-%Y %H:%M", 
        "%m-%d-%Y"
    ):
        try:
            parsed_dt = datetime.strptime(cleaned, fmt)
            break
        except ValueError:
            continue
            
    if not parsed_dt:
        try:
            parsed_dt = datetime.fromisoformat(cleaned)
        except Exception:
            raise HTTPException(status_code=400, detail="Please enter a valid ETA date.")
            
    now = datetime.now()
    current_year = now.year
    max_year = current_year + 5
    
    if parsed_dt.year < current_year or parsed_dt.year > max_year:
        raise HTTPException(
            status_code=400,
            detail=f"ETA year must be between {current_year} and {max_year}."
        )
        
    # Check if past date
    start_of_today = datetime(now.year, now.month, now.day)
    if parsed_dt < start_of_today:
        raise HTTPException(
            status_code=400,
            detail="ETA date cannot be in the past."
        )



@router.post("/tasks", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db)
):
    if task.update_url:
        validate_url(task.update_url)

    if task.eta:
        validate_eta(task.eta)

    new_task = Task(
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to,
        status="Not Started",
        priority=task.priority,
        eta=task.eta,
        update_url=task.update_url
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/tasks",
            response_model=list[TaskResponse])
def get_tasks(
    db: Session = Depends(get_db)
):

    tasks = db.query(Task).all()

    return tasks


# NEW ROUTE
@router.get("/tasks/user/{user_id}",
            response_model=list[TaskResponse])
def get_user_tasks(
    user_id: int,
    db: Session = Depends(get_db)
):

    tasks = db.query(Task).filter(
        Task.assigned_to == user_id
    ).all()

    return tasks


@router.get("/tasks/{task_id}",
            response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):

    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        return {"message": "Task not found"}

    return task


@router.put("/tasks/{task_id}",
            response_model=TaskResponse)
def update_task(
    task_id: int,
    updated_task: TaskUpdate,
    db: Session = Depends(get_db)
):

    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        return {"message": "Task not found"}

    task.status = updated_task.status

    db.commit()
    db.refresh(task)

    return task