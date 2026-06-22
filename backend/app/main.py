from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from app.database.db import engine, Base

from app.models.user import User
from app.models.task import Task
from app.models.approval import ApprovalRequest

from app.routes.auth import router as auth_router
from app.routes.tasks import router as task_router
from app.routes.approvals import router as approval_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Run migrations for tasks columns if needed
try:
    with engine.begin() as conn:
        result = conn.execute(text("PRAGMA table_info(tasks)"))
        columns = [row[1] for row in result.fetchall()]
        if "priority" not in columns:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN priority VARCHAR DEFAULT 'Medium'"))
        if "eta" not in columns:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN eta VARCHAR"))
        if "update_url" not in columns:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN update_url VARCHAR"))
except Exception as e:
    print(f"Automatic migration check failed: {e}")

# Create FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(task_router)
app.include_router(approval_router)

# Home route
@app.get("/")
def home():
    return {"message": "Backend Working u da real art"}