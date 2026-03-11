from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Team, TeamMember, Project
from app.schemas import ProjectInitialize, DashboardResponse, MemberOut, SubjectOut
from typing import Optional

router = APIRouter()

@router.post("/project/initialize")
def initialize_project(data: ProjectInitialize, db: Session = Depends(get_db)):
    # 1. Fetch the team
    team = db.query(Team).filter(Team.id == data.team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # 2. Check if user is the leader
    if team.leader_id != data.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team leader can initialize projects"
        )
    
    # 3. Fetch the project record for the subject
    project = db.query(Project).filter(
        Project.team_id == data.team_id,
        Project.subject == data.subject
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project for subject '{data.subject}' not found for this team"
        )
    
    # 4. Update title and description
    project.title = data.title
    project.description = data.description
    
    db.commit()
    db.refresh(project)
    
    return {"message": f"Project for '{data.subject}' initialized successfully"}

@router.get("/student/dashboard", response_model=DashboardResponse)
def get_student_dashboard(user_id: int, db: Session = Depends(get_db)):
    # 1. Fetch the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 2. Check if user belongs to a team
    membership = db.query(TeamMember).filter(TeamMember.user_id == user_id).first()
    
    if not membership:
        # Team not yet formed
        return DashboardResponse(
            message="Waiting for team members to join LG"
        )
    
    # 3. Fetch team details
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    
    # 4. Fetch team members
    member_records = db.query(User).join(TeamMember).filter(TeamMember.team_id == team.id).all()
    members_out = [MemberOut(name=m.name) for m in member_records]
    
    # 5. Fetch subjects/projects
    project_records = db.query(Project).filter(Project.team_id == team.id).all()
    subjects_out = [SubjectOut(id=p.id, subject=p.subject, title=p.title) for p in project_records]
    
    return DashboardResponse(
        team_id=team.id,
        leader_id=team.leader_id,
        members=members_out,
        subjects=subjects_out
    )
