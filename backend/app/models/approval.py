from sqlalchemy import Column, Integer, String
from app.database.db import Base

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer)
    requested_by = Column(Integer)
    requested_status = Column(String)
    approval_status = Column(String)