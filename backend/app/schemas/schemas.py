from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not v.strip():
            raise ValueError("Password cannot be empty")
        return v
class TaskCreate(BaseModel):
    title: str
    description: str
    assigned_to: int
    priority: str = "Medium"
    eta: str | None = None
    update_url: str | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    assigned_to: int
    priority: str
    eta: str | None = None
    update_url: str | None = None

    class Config:
        from_attributes = True
class TaskUpdate(BaseModel):
    status: str
class ApprovalRequestCreate(BaseModel):
    task_id: int
    requested_by: int
    requested_status: str


class ApprovalResponse(BaseModel):
    id: int
    task_id: int
    requested_by: int
    requested_status: str
    approval_status: str

    class Config:
        from_attributes = True