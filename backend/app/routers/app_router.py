from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TeamMember, TeamProject, Subject
from app.schemas import ProjectCreate, DashboardResponse, UserInfo, SubjectCardOut
from typing import List

router = APIRouter()

@router.get("/student/dashboard", response_model=DashboardResponse)
def get_student_dashboard(user_id: int, db: Session = Depends(get_db)):
    # 1. Fetch the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Get user info
    user_info = UserInfo(
        id=user.id,
        name=user.name,
        class_section=user.class_section,
        lg_number=user.lg_number
    )

    # 3. Get team members
    team_members_list = []
    leader_name = None
    leader_id = None
    
    if user.class_section and user.lg_number:
        members = db.query(User).join(TeamMember, User.id == TeamMember.user_id).filter(
            TeamMember.class_section == user.class_section,
            TeamMember.lg_number == user.lg_number
        ).all()
        
        team_members_list = [
            UserInfo(id=m.id, name=m.name, class_section=m.class_section, lg_number=m.lg_number) 
            for m in members
        ]
        
        # Find leader
        leader_record = db.query(TeamMember).filter(
            TeamMember.class_section == user.class_section,
            TeamMember.lg_number == user.lg_number,
            TeamMember.is_leader == True
        ).first()
        
        if leader_record:
            leader_id = leader_record.user_id
            leader_user = db.query(User).filter(User.id == leader_id).first()
            if leader_user:
                leader_name = leader_user.name

    # 4. Get subjects and check for projects
    subjects = db.query(Subject).all()
    subject_cards = []
    
    for sub in subjects:
        project = None
        if user.class_section and user.lg_number:
            project = db.query(TeamProject).filter(
                TeamProject.class_section == user.class_section,
                TeamProject.lg_number == user.lg_number,
                TeamProject.subject_id == sub.id
            ).first()
        
        if project:
            from app.services.phase_engine import get_current_phase, PHASES
            phase_name = get_current_phase(project)
            # Simple progress: percentage of phases completed
            progress = int((project.current_phase_index / len(PHASES)) * 100)
        else:
            phase_name = "Project Setup"
            progress = 0
        
        card = SubjectCardOut(
            id=sub.id,
            name=sub.name,
            project_title=project.title if project else None,
            phase=phase_name,
            progress=progress
        )
        subject_cards.append(card)

    return DashboardResponse(
        user=user_info,
        team_members=team_members_list,
        leader=leader_name,
        leader_id=leader_id,
        subjects=subject_cards
    )

@router.post("/project/create")
def create_project(data: ProjectCreate, user_id: int, db: Session = Depends(get_db)):
    # 1. Check if user is the leader of the LG
    leader_record = db.query(TeamMember).filter(
        TeamMember.user_id == user_id,
        TeamMember.class_section == data.class_section,
        TeamMember.lg_number == data.lg_number,
        TeamMember.is_leader == True
    ).first()
    
    if not leader_record:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team leader can create projects."
        )
    
    # 2. Check if project already exists for this subject and LG
    existing_project = db.query(TeamProject).filter(
        TeamProject.class_section == data.class_section,
        TeamProject.lg_number == data.lg_number,
        TeamProject.subject_id == data.subject_id
    ).first()
    
    if existing_project:
        # Update existing
        existing_project.title = data.title
        existing_project.description = data.description
        db.commit()
        return {"message": "Project updated successfully"}
    
    # 3. Create new project
    new_project = TeamProject(
        class_section=data.class_section,
        lg_number=data.lg_number,
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
        leader_id=user_id
    )
    
    db.add(new_project)
    db.commit()
    
    return {"message": "Project created successfully"}
