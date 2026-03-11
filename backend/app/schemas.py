from pydantic import BaseModel, EmailStr
from typing import Optional

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    roll_number: Optional[str] = None
    class_section: Optional[str] = None
    lg_number: Optional[int] = None
    skills: Optional[str] = None
    availability: Optional[str] = None

class UserLogin(BaseModel) :
    email: EmailStr
    password: str

class ProjectInitialize(BaseModel):
    user_id: int
    team_id: int
    subject: str
    title: str
    description: str

class MemberOut(BaseModel):
    name: str

class SubjectOut(BaseModel):
    id: int
    subject: str
    title: Optional[str] = None

class DashboardResponse(BaseModel):
    team_id: Optional[int] = None
    leader_id: Optional[int] = None
    members: list[MemberOut] = []
    subjects: list[SubjectOut] = []
    message: Optional[str] = None
