from sqlalchemy import Column, Integer, String
from app.database.db import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(String)
    assigned_to = Column(Integer)
    priority = Column(String, default="Medium")
    eta = Column(String, nullable=True)
    update_url = Column(String, nullable=True)