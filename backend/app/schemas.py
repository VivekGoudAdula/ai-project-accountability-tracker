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

class PhaseInfo(BaseModel):
    week_number: int
    current_phase: str
    submission_open: bool
    phase_map: dict[int, str]

class TaskOut(BaseModel):
    id: int
    team_id: int
    subject: str
    phase: str
    member_id: int
    task: str

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    team_id: int
    user_id: int
    subject: str
    phase: str
    tasks_done: str
    hours_spent: int
    github_link: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    team_id: int
    user_id: int
    subject: str
    phase: str
    file_path: Optional[str] = None
    github_link: Optional[str] = None
    tasks_done: Optional[str] = None
    hours_spent: Optional[int] = None
    ai_score: Optional[int] = None
    ai_feedback: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
