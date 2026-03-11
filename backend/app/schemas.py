from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

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

class ProjectCreate(BaseModel):
    subject_id: int
    title: str
    description: str
    class_section: str
    lg_number: int

class UserInfo(BaseModel):
    id: int
    name: str
    class_section: Optional[str]
    lg_number: Optional[int]

class SubjectCardOut(BaseModel):
    id: int
    name: str
    project_title: Optional[str] = None
    phase: Optional[str] = "Phase 1: Project Setup"
    progress: Optional[int] = 0

class DashboardResponse(BaseModel):
    user: UserInfo
    team_members: List[UserInfo]
    leader: Optional[str]
    leader_id: Optional[int]
    subjects: List[SubjectCardOut]

class TaskOut(BaseModel):
    id: int
    phase: str
    member_id: int
    task: str

    class Config:
        from_attributes = True

class ProjectOut(BaseModel):
    id: int
    subject_id: int
    title: str
    description: str
    class_section: str
    lg_number: int
    leader_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PhaseInfo(BaseModel):
    week_number: int
    current_phase: str
    submission_open: bool
    phase_map: Dict[int, str]

class SubmissionCreate(BaseModel):
    user_id: int
    subject_id: int
    phase: str
    description: str
    github_link: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    user_id: int
    subject_id: int
    phase: str
    week_number: Optional[int]
    file_path: Optional[str] = None
    github_link: Optional[str] = None
    description: Optional[str] = None
    ai_score: Optional[int] = None
    ai_feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
